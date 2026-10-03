/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/verbinden/besprechung.ts (npm run bauen:ts). */
/* ============================================================================
 * meeting.js — Meeting Notes
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/verbinden/besprechung.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/verbinden/besprechung.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Der Ablauf aus der Doku, Schritt für Schritt:
 *
 *     Audio  →  Transkript  →  KI-Zusammenfassung  →  Aufgaben und
 *     Entscheidungen  →  Notion-Seite
 *
 * WIE DAS OHNE DIENST GEHT
 *   Der Browser kann selbst zuhören. Chrome und Edge bringen eine
 *   Spracherkennung mit (SpeechRecognition), die live mitschreibt —
 *   kostenlos, ohne Schlüssel, ohne Konto. Parallel läuft eine Aufnahme
 *   mit dem MediaRecorder, damit man später nachhören kann.
 *
 *   Firefox und Safari haben die Spracherkennung nicht. Dort wird nur
 *   aufgenommen, und das Transkript tippt man selbst — oder man lädt es
 *   als Textdatei dazu. Das steht auch so in der Oberfläche; es wird
 *   nichts vorgetäuscht.
 *
 * WAS WO BLEIBT
 *   Die Aufnahme liegt im Browser. In den Einstellungen steht, ob sie
 *   überhaupt behalten wird und ob das Transkript nach der Zusammenfassung
 *   gelöscht werden soll.
 * ==========================================================================*/

const Meeting = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  const esc = (s: string) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const p2 = (n: number) => String(n).padStart(2, '0');

  /* ------------------------------------------------------------------------
   * EINSTELLUNGEN
   * ----------------------------------------------------------------------*/
  const E = {
    audioBehalten: () => Store.getMeta('meet:audio', true),
    transkriptLoeschen: () => Store.getMeta('meet:transkriptWeg', false),
    sprache: () => Store.getMeta('meet:sprache', 'de-DE'),
    /* Der Sidecar wird nie von selbst angesprochen. Eine Adresse allein
       schaltet nichts ein; erst der ausdrückliche Knopf nach der Aufnahme
       und eine Zustimmung schicken Ton dorthin. */
    sidecar: () => String(Store.getMeta('meet:sidecar', '') || '').trim()
  };

  /* Die Spracherkennung gibt es nur in Chrome und Edge, in Safari unter
     altem Namen — und in keiner Typendatei. Deshalb hier einmal benannt,
     statt an fünf Stellen `as any` zu streuen. */
  type MitErkennung = Window & {
    SpeechRecognition?: new () => any;
    webkitSpeechRecognition?: new () => any;
  };
  const erkennungsBau = (): (new () => any) | undefined =>
    (window as MitErkennung).SpeechRecognition ||
    (window as MitErkennung).webkitSpeechRecognition;

  const kannZuhoeren = () => !!erkennungsBau();
  const kannAufnehmen = () =>
    !!(navigator.mediaDevices && window.MediaRecorder);

  /* ------------------------------------------------------------------------
   * DIE AUFNAHME
   * ----------------------------------------------------------------------*/
  type AudioMarke = { sek: number; text: string };
  type Lauf = {
    start: number;
    stuecke: Blob[];
    transkript: { sek: number; text: string }[];
    marken: AudioMarke[];
    teil: string;
    recorder: MediaRecorder | null;
    erkennung: any;
    strom: MediaStream | null;
    uhr: ReturnType<typeof setInterval> | null;
    mime: string;
    fehler: string;
  };
  type AufnahmeErgebnis = {
    transkript: { sek: number; text: string }[];
    marken: AudioMarke[];
    dauer: number;
    blob: Blob | null;
    typ: string;
    warnung: string;
  };

  let laeuft: Lauf | null = null;

  /** Der Browser entscheidet letztlich. Wir bevorzugen Opus, greifen aber
      nicht zu einem Typ, den seine MediaRecorder-Implementierung ablehnt. */
  const aufnahmeTyp = (): string => {
    const moeglich = [
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/mp4;codecs=mp4a.40.2',
      'audio/webm',
      'audio/mp4'
    ];
    if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return '';
    return moeglich.find(t => MediaRecorder.isTypeSupported(t)) || '';
  };

  const starten = async (beiText: any, beiZeit: any) => {
    if (laeuft) throw new Error('Es läuft schon eine Aufnahme.');

    const zustand: Lauf = {
      start: Date.now(), stuecke: [], transkript: [], marken: [], teil: '',
      recorder: null, erkennung: null, strom: null, uhr: null,
      mime: '', fehler: ''
    };

    /* 1. Mitschnitt */
    if (kannAufnehmen()) {
      try {
        zustand.strom = await navigator.mediaDevices.getUserMedia({ audio: true });
        const wunsch = aufnahmeTyp();
        zustand.recorder = wunsch
          ? new MediaRecorder(zustand.strom, { mimeType: wunsch })
          : new MediaRecorder(zustand.strom);
        zustand.mime = zustand.recorder.mimeType || wunsch;
        zustand.recorder.ondataavailable = (e: BlobEvent) => {
          if (e.data && e.data.size) zustand.stuecke.push(e.data);
        };
        zustand.recorder.onerror = (e: Event) => {
          const meldung = (e as any).error?.message || 'Der Browser meldet einen Aufnahmefehler.';
          zustand.fehler = String(meldung);
          UI.banner('Mitschnitt: ' + zustand.fehler +
            ' Bereits empfangene Teile bleiben erhalten.', 'warn');
        };
        zustand.recorder.start(1000);
      } catch (e: unknown) {
        zustand.strom?.getTracks().forEach(t => t.stop());
        throw new Error('Das Mikrofon wurde nicht freigegeben: ' +
          (e instanceof Error ? e.message : String(e)));
      }
    }

    /* 2. Mitschreiben */
    if (kannZuhoeren()) {
      const SR = erkennungsBau();
      if (SR) {
        const r = new SR();
        r.lang = E.sprache();
        r.continuous = true;
        r.interimResults = true;
        r.onresult = (e: any) => {
          let teil = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const t = e.results[i][0].transcript;
            if (e.results[i].isFinal) {
              const sek = Math.round((Date.now() - zustand.start) / 1000);
              zustand.transkript.push({ sek, text: t.trim() });
            } else teil += t;
          }
          zustand.teil = teil;
          if (beiText) beiText(zustand.transkript, teil);
        };
        /* Die Erkennung hört von selbst auf — dann eben wieder anfangen. */
        r.onend = () => { if (laeuft === zustand) { try { r.start(); } catch {} } };
        r.onerror = (e: any) => {
          if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
            UI.banner('Die Spracherkennung wurde nicht erlaubt. Es wird nur aufgenommen.', 'warn');
          }
        };
        try { r.start(); zustand.erkennung = r; } catch {}
      }
    }

    zustand.uhr = setInterval(() => {
      if (beiZeit) beiZeit(Math.round((Date.now() - zustand.start) / 1000));
    }, 1000);

    laeuft = zustand;
    return zustand;
  };

  /** Eine bewusste Marke während der laufenden Aufnahme. Sie wird später als
      normaler Textblock gespeichert und verweist auf die Tonstelle. */
  const markieren = (text = ''): AudioMarke | null => {
    if (!laeuft) return null;
    const marke = {
      sek: Math.max(0, Math.round((Date.now() - laeuft.start) / 1000)),
      text: String(text || '').trim() || 'Zeitmarke'
    };
    laeuft.marken.push(marke);
    return marke;
  };

  const stoppen = () => new Promise<AufnahmeErgebnis | null>((ok) => {
    const z = laeuft;
    if (!z) { ok(null); return; }
    laeuft = null;
    if (z.uhr) clearInterval(z.uhr);
    if (z.erkennung) { try { z.erkennung.stop(); } catch {} }

    let beendet = false;
    const fertig = () => {
      if (beendet) return;
      beendet = true;
      if (z.strom) z.strom.getTracks().forEach((t: any) => t.stop());
      /* Ein noch nicht als „final“ gemeldeter Satz darf beim Stoppen nicht
         verschwinden. Er bleibt mit seiner Zeit im normalen Transkript. */
      const rest = String(z.teil || '').trim();
      if (rest && z.transkript[z.transkript.length - 1]?.text !== rest)
        z.transkript.push({
          sek: Math.round((Date.now() - z.start) / 1000),
          text: rest
        });
      const typ = z.recorder?.mimeType || z.mime || z.stuecke.find(s => !!s.type)?.type || 'audio/webm';
      const blob = z.stuecke.length ? new Blob(z.stuecke, { type: typ }) : null;
      ok({
        transkript: z.transkript,
        marken: z.marken,
        dauer: Math.round((Date.now() - z.start) / 1000),
        blob,
        typ,
        warnung: z.fehler
      });
    };

    if (z.recorder && z.recorder.state !== 'inactive') {
      z.recorder.onstop = fertig;
      try { z.recorder.stop(); } catch { fertig(); }
    } else fertig();
  });

  const zeitText = (sek: number) => p2(Math.floor(sek / 60)) + ':' + p2(sek % 60);

  const transkriptText = (liste: any) =>
    (liste || []).map((z: any) => '[' + zeitText(z.sek) + '] ' + z.text).join('\n');

  type AudioAblage = {
    dateiId: string;
    blockId: string;
    name: string;
    typ: string;
    marken: AudioMarke[];
  };

  const audioEndung = (typ: string): string => {
    const rein = String(typ || '').split(';')[0]!.toLowerCase();
    if (rein === 'audio/ogg') return 'ogg';
    if (rein === 'audio/mp4' || rein === 'audio/m4a' || rein === 'audio/x-m4a') return 'm4a';
    if (rein === 'audio/mpeg') return 'mp3';
    if (rein === 'audio/wav' || rein === 'audio/x-wav') return 'wav';
    return 'webm';
  };

  /** Speichert einen Mitschnitt in derselben Stück-Ablage wie andere
      Anhänge. Die reservierte Blockkennung macht eine unterbrochene
      Seitenanlage als verwaist erkennbar und damit aufräumbar. */
  const audioAblegen = async (
    blob: Blob,
    dauer: number,
    marken: AudioMarke[] = [],
    blockId = Store.uid()
  ): Promise<AudioAblage> => {
    if (!blob || !blob.size) throw new Error('Der Mitschnitt enthält keine Audiodaten.');
    const typ = blob.type || 'audio/webm';
    const laenge = Math.max(0, Math.round(Number(dauer) || 0));
    const name = 'Mitschnitt-' + new Date().toISOString().replace(/[:.]/g, '-') +
      '-' + Math.floor(laenge / 60) + 'm' + (laenge % 60) + 's.' + audioEndung(typ);
    const satz = await Dateien.ablegen(blob, {
      name,
      blockId,
      beiFortschritt: (_anteil: number) => { /* Die Oberfläche zeigt den Speicherzustand. */ }
    });
    return {
      dateiId: satz.id,
      blockId,
      name,
      typ: satz.typ || typ,
      marken: marken.map(m => ({ sek: Math.max(0, Number(m.sek) || 0), text: String(m.text || '') }))
    };
  };

  /** Ein optionaler Sidecar ist ein bewusster Export. Ohne gültige Adresse,
      Knopfdruck und anschliessende Zustimmung bleibt der Ton lokal. */
  const sidecarTranskribieren = async (blob: Blob): Promise<string> => {
    const roh = E.sidecar();
    if (!roh) throw new Error('In den Einstellungen ist kein Transkriptionsdienst eingetragen.');
    let adresse: URL;
    try { adresse = new URL(roh); }
    catch { throw new Error('Die Adresse des Transkriptionsdiensts ist ungültig.'); }
    if (!['http:', 'https:'].includes(adresse.protocol))
      throw new Error('Der Transkriptionsdienst braucht eine HTTP- oder HTTPS-Adresse.');
    if (!confirm('Tonaufnahme an „' + adresse.host + '“ senden und dort transkribieren lassen?'))
      throw new Error('Übertragung nicht bestätigt.');

    const daten = new FormData();
    daten.append('audio', blob, 'mitschnitt.' + audioEndung(blob.type));
    daten.append('language', E.sprache());
    const antwort = await fetch(adresse.toString(), { method: 'POST', body: daten });
    if (!antwort.ok) throw new Error('Der Transkriptionsdienst antwortet mit ' + antwort.status + '.');
    const typ = String(antwort.headers.get('content-type') || '');
    if (typ.includes('application/json')) {
      const json = await antwort.json();
      const text = String(json?.text || json?.transcript || json?.transkript || '').trim();
      if (!text) throw new Error('Die Antwort enthält kein Transkript.');
      return text.slice(0, 500000);
    }
    const text = (await antwort.text()).trim();
    if (!text) throw new Error('Die Antwort enthält kein Transkript.');
    return text.slice(0, 500000);
  };

  /* ------------------------------------------------------------------------
   * AUSWERTEN
   * ------------------------------------------------------------------------
   * Ein Durchgang, drei Ergebnisse: Zusammenfassung, Entscheidungen,
   * Aufgaben. Alles auf einmal, damit das lokale Modell nicht dreimal
   * denselben Text lesen muss.
   * ----------------------------------------------------------------------*/
  const auswerten = async (text: string, beiFortschritt: any) => {
    if (!String(text || '').trim()) throw new Error('Es gibt keinen Text zum Auswerten.');

    const anweisung =
      'Du wertest ein Besprechungsprotokoll aus. Antworte AUSSCHLIESSLICH mit JSON, ' +
      'ohne Text davor oder danach, in genau dieser Form:\n' +
      '{"titel":"kurzer Titel der Besprechung",' +
      '"zusammenfassung":["Punkt 1","Punkt 2"],' +
      '"entscheidungen":["Was beschlossen wurde"],' +
      '"aufgaben":[{"was":"Aufgabe","wer":"Name oder leer","bis":"JJJJ-MM-TT oder leer",' +
        '"sek":0}],' +
      '"themen":["Thema"],"beteiligte":["Name"]}\n' +
      'Höchstens sechs Punkte je Liste. Alles auf Deutsch. ' +
      'Erfinde nichts — was nicht im Text steht, lässt du weg.\n' +
      /* §44 will den Weg zurück bis auf die Sekunde. Die Zeiten stehen im
         Protokoll ([mm:ss] am Zeilenanfang); welche Zeile zu welcher
         Aufgabe gehört, weiss nur, wer den Text gelesen hat. Also fragen
         wir danach — und glauben die Antwort nur, wenn es die Zeile
         wirklich gibt (siehe `sekundeAusText`, E161). */
      'Bei „sek" trägst du die Zeitmarke der Zeile ein, in der die Aufgabe ' +
      'besprochen wird — die Zahl aus [mm:ss] am Zeilenanfang, umgerechnet ' +
      'in Sekunden. Bist du dir nicht sicher, lässt du „sek" weg.';

    if (beiFortschritt) beiFortschritt('Die KI liest mit …');
    const roh = await KI.frageKurz('Das Protokoll:\n\n' + String(text).slice(0, 12000), anweisung);
    const plan = Agent.JSON_HOLEN(roh);
    if (!plan) throw new Error('Die KI hat kein brauchbares Ergebnis geliefert.');
    return plan;
  };

  /* ------------------------------------------------------------------------
   * DIE SEITE
   * ----------------------------------------------------------------------*/
  const seiteAnlegen = (ergebnis: any, transkript: any, dauer: number,
      audio: AudioAblage | string | null) => {
    const jetzt = new Date();
    const p = Store.addPage(App.aktuelleSeite(), {
      text: (ergebnis.titel || 'Besprechung') + ' · ' + jetzt.toLocaleDateString('de-DE'),
      icon: '🎙', besprechung: true
    });

    Store.addBlock(p.id, 'callout', {
      text: jetzt.toLocaleString('de-DE') + ' · Dauer ' + zeitText(dauer || 0) +
            ((ergebnis.beteiligte || []).length ? ' · ' + ergebnis.beteiligte.join(', ') : ''),
      icon: '🎙', color: 'bg-blue'
    });

    if ((ergebnis.zusammenfassung || []).length) {
      Store.addBlock(p.id, 'h2', { text: 'Zusammenfassung' });
      ergebnis.zusammenfassung.forEach((x: any) => Store.addBlock(p.id, 'bullet', { text: String(x) }));
    }

    if ((ergebnis.entscheidungen || []).length) {
      Store.addBlock(p.id, 'h2', { text: 'Entscheidungen' });
      ergebnis.entscheidungen.forEach((x: any) => Store.addBlock(p.id, 'quote', { text: String(x) }));
    }

    /* WELCHE SEKUNDEN ES IM PROTOKOLL WIRKLICH GIBT.
       Die KI darf zu jeder Aufgabe eine Zeitmarke nennen. Geglaubt wird sie
       nur, wenn eine Zeile mit genau dieser Zeit dasteht — geraten wäre
       schlimmer als gar nichts: man springt hin, hört etwas anderes und
       hält die Aufnahme für kaputt (L57).

       Dasselbe Muster wie unten beim Transkript, absichtlich Zeichen für
       Zeichen: was hier nicht als Zeitmarke gilt, bekommt dort auch keinen
       `audioRef`, und dann zeigte der Sprung ins Leere. */
    const ZEITMARKE = /^\[(?:(\d+):)?(\d{1,2}):(\d{2})\]\s*/;
    const sekundenImText = new Set<number>();
    String(transkript || '').split('\n').forEach(z => {
      const m = ZEITMARKE.exec(z.trim());
      if (m) sekundenImText.add(Number(m[1] || 0) * 3600 + Number(m[2]) * 60 + Number(m[3]));
    });
    const sekundeAusText = (a: any): number | null => {
      const s = Math.round(Number(a?.sek));
      if (!Number.isFinite(s) || s < 0) return null;
      return sekundenImText.has(s) ? s : null;
    };

    /* Die Aufgabenblöcke entstehen VOR dem Transkript, ihr Ziel liegt aber
       darin. Also erst anlegen und merken, den `sourceRef` weiter unten
       nachtragen — das ist billiger, als die Seite umzusortieren. */
    const aufgabenBloecke: Array<{ id: string; sek: number | null }> = [];
    if ((ergebnis.aufgaben || []).length) {
      Store.addBlock(p.id, 'h2', { text: 'Aufgaben' });
      ergebnis.aufgaben.forEach((a: any) => {
        const b = Store.addBlock(p.id, 'todo', {
          text: String(a.was || a) + (a.wer ? ' — ' + a.wer : '') + (a.bis ? ' (bis ' + a.bis + ')' : '')
        });
        aufgabenBloecke.push({ id: b.id, sek: sekundeAusText(a) });
      });
    }

    if ((ergebnis.themen || []).length) {
      Store.addBlock(p.id, 'h2', { text: 'Themen' });
      Store.addBlock(p.id, 'text', { text: ergebnis.themen.map((t: any) => '#' + String(t).replace(/\s+/g, '-')).join(' ') });
    }

    let audioBlock: any = null;
    if (audio && E.audioBehalten()) {
      Store.addBlock(p.id, 'h2', { text: 'Aufnahme' });
      /* `string` ist der Altbestand: vorhandene Data-URL-Aufnahmen bleiben
         abspielbar. Neue Aufnahmen tragen nur die stabile Datei-Kennung. */
      audioBlock = typeof audio === 'string'
        ? Store.addBlock(p.id, 'audio', {
            src: audio,
            caption: 'Mitschnitt · ' + zeitText(dauer || 0)
          })
        : Store.addBlock(p.id, 'audio', {
            id: audio.blockId,
            dateiId: audio.dateiId,
            typ: audio.typ,
            text: audio.name,
            caption: 'Mitschnitt · ' + zeitText(dauer || 0)
          });

      if (typeof audio !== 'string' && audio.marken.length) {
        Store.addBlock(p.id, 'h2', { text: 'Zeitmarken' });
        audio.marken.forEach(m => Store.addBlock(p.id, 'text', {
          text: zeitText(m.sek) + ' · ' + (m.text || 'Zeitmarke'),
          audioRef: { blockId: audioBlock.id, dateiId: audio.dateiId, sek: m.sek }
        }));
      }
    }

    /* Welche Zeile zu welcher Sekunde gehört — für den Rücksprung unten. */
    const zeileZurSekunde = new Map<number, string>();
    if (transkript && !E.transkriptLoeschen()) {
      const t = Store.addBlock(p.id, 'toggle', { text: 'Volles Transkript', open: false });
      String(transkript).split('\n').slice(0, 400).forEach(z => {
        if (!z.trim()) return;
        const m = ZEITMARKE.exec(z.trim());
        const sek = m ? (Number(m[1] || 0) * 3600 + Number(m[2]) * 60 + Number(m[3])) : null;
        const zeile = Store.addBlock(t.id, 'text', Object.assign(
          { text: z },
          audioBlock && sek !== null
            ? { audioRef: {
                blockId: audioBlock.id,
                dateiId: typeof audio === 'string' ? undefined : audio?.dateiId,
                sek
              } }
            : {}
        ));
        if (sek !== null && !zeileZurSekunde.has(sek)) zeileZurSekunde.set(sek, zeile.id);
      });
    }

    /* DER WEG ZURÜCK (§44, E161).
       Bis hierher schrieb `seiteAnlegen` gar keine Herkunft — eine Aufgabe
       aus einer Besprechung wusste nicht, woher sie kam. Der Rücksprung im
       Editor gab es zwar, aber nur für Blöcke, die anderswo einen
       `sourceRef` bekamen; für Besprechungsaufgaben war er tote Mechanik.

       Mit Sekunde zeigt der Knopf sie an: „↩ Bauleitung KW 35 · 01:02".
       `zeit` steht als fertiger Text daneben, damit der Editor die Zahl
       nicht formatieren muss — er darf `bereiche/verbinden` nicht kennen
       (CLAUDE.md §5 Regel 1), und eine zweite Formatierfunktion wäre genau
       die Abschrift, die E159 gerade zusammengelegt hat. */
    const quelleFuer = (sek: number | null) => {
      const zielId = sek !== null ? zeileZurSekunde.get(sek) : undefined;
      return Object.assign({
        version: 1,
        kind: zielId ? 'block' : 'seite',
        pageId: p.id,
        blockId: zielId || p.id,
        label: String(p.text || 'Besprechung'),
        createdAt: Store.now()
      }, sek !== null ? { sek, zeit: zeitText(sek) } : {});
    };
    aufgabenBloecke.forEach(x => {
      const quelle = quelleFuer(x.sek);
      Store.updateBlock(x.id, { sourceRef: quelle, lernquelle: quelle });
    });

    /* Aufgaben zusätzlich in eine Datenbank, damit sie nicht nur auf dieser
       Seite stehen — genau das macht Notion auch. */
    if ((ergebnis.aufgaben || []).length) {
      const db = aufgabenDatenbank();
      ergebnis.aufgaben.forEach((a: any, i: number) => {
        const r = Store.addRow(db.id, {
          wer: a.wer || '', bis: a.bis || '', status: 'Offen',
          quelle: ergebnis.titel || 'Besprechung', seite: p.id
        });
        /* Die Zeile in der Datenbank ist dieselbe Aufgabe wie der Block auf
           der Seite — sie bekommt denselben Weg zurück. Ohne ihn steht in
           „Meine Aufgaben" eine Zeile ohne Herkunft, und die Spalte
           „quelle" nennt nur einen Titel, den man nicht anklicken kann. */
        const quelle = quelleFuer(aufgabenBloecke[i]?.sek ?? null);
        Store.updateBlock(r.id, { text: String(a.was || a), sourceRef: quelle });
      });
    }

    App.zeichneBaum();
    return p;
  };

  const aufgabenDatenbank = () => {
    const da = Object.values<any>(Store.cache.collections)
      .find(c => c.name === 'Aufgaben aus Besprechungen');
    if (da) return da;
    let eltern = Store.rootPages().find((p: any) => p.text === 'Besprechungen');
    if (!eltern) eltern = Store.addPage(null, { text: 'Besprechungen', icon: '🎙' });
    const { collectionId } = Store.addDatabase(eltern.id, 'Aufgaben aus Besprechungen', {
      title:  { name: 'Aufgabe', type: 'title' },
      wer:    { name: 'Wer',     type: 'person' },
      bis:    { name: 'Bis',     type: 'date' },
      status: { name: 'Status',  type: 'status', options: [
                  { name: 'Offen', color: 'blue' },
                  { name: 'In Arbeit', color: 'yellow' },
                  { name: 'Erledigt', color: 'green' }] },
      quelle: { name: 'Aus welcher Besprechung', type: 'text' },
      seite:  { name: 'Seite', type: 'text' }
    }, 'board');
    return Store.getCollection(collectionId);
  };

  /* ------------------------------------------------------------------------
   * OBERFLÄCHE
   * ----------------------------------------------------------------------*/
  const panel = () => {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = '<div class="finder" style="width:min(720px,95vw)">' +
      '<div class="fh">🎙 Besprechungsnotizen<button class="icon-btn" data-a="zu">✕</button></div>' +
      '<div id="mk" style="padding:14px 18px 6px"></div>' +
      '<div class="meet-text" id="mt"></div>' +
      '<div class="fbtns" id="mf"></div></div>';
    document.body.appendChild(o);

    let phase = 'bereit';       /* bereit · laeuft · speichert · fertig · ausgewertet */
    let ergebnisAudio: AudioAblage | null = null;
    let ergebnisRohBlob: Blob | null = null;
    let ergebnisMarken: AudioMarke[] = [];
    let audioBlockId = '';
    let audioSpeichert = false;
    let aufnahmeWarnung = '';
    let ergebnisText = '';
    let ergebnisDauer = 0;
    let auswertung: any = null;

    const kopf = (): void => {
      const k = o.querySelector('#mk');
      if (!k) return;
      if (phase === 'bereit') {
        k.innerHTML =
          '<div class="verb-text">Der Browser hört zu und schreibt live mit. ' +
          'Danach macht die KI daraus Zusammenfassung, Entscheidungen und Aufgaben.</div>' +
          (kannZuhoeren()
            ? '<div class="meet-ok">✓ Diese Browserversion kann live mitschreiben.</div>'
            : '<div class="meet-warn">Dieser Browser kann nicht live mitschreiben. ' +
              'Chrome und Edge können es. Es wird trotzdem aufgenommen — das Transkript ' +
              'kannst du danach einfügen oder als Textdatei laden.</div>') +
          (kannAufnehmen() ? '' : '<div class="meet-warn">Aufnehmen geht hier auch nicht. ' +
            'Du kannst trotzdem ein vorhandenes Transkript einfügen und auswerten lassen.</div>');
      }
      if (phase === 'laeuft') {
        const marken = laeuft?.marken || [];
        const letzte = marken.length ? marken[marken.length - 1] : null;
        k.innerHTML = '<div class="meet-laeuft"><span class="meet-punkt"></span>' +
                      '<b id="muhr">00:00</b><span>läuft — sprich einfach weiter</span></div>' +
          (letzte
            ? '<div class="verb-text">' + marken.length + ' Zeitmarke(n) · zuletzt ' +
              zeitText(letzte.sek) + ' „' + esc(letzte.text) + '“</div>'
            : '');
      }
      if (phase === 'speichert') {
        k.innerHTML = '<div class="agent-laeuft">Der Mitschnitt wird lokal in Stücken gespeichert …</div>';
      }
      if (phase === 'fertig') {
        k.innerHTML = '<div class="verb-text">Aufnahme beendet nach ' + zeitText(ergebnisDauer) +
          '. Der Text unten lässt sich noch bearbeiten, bevor die KI ihn liest.</div>' +
          (ergebnisAudio
            ? '<div class="meet-ok">✓ Mitschnitt lokal gespeichert · ' +
              esc(ergebnisAudio.name) + '</div>'
            : (ergebnisRohBlob && E.audioBehalten()
                ? '<div class="meet-warn">Der Ton ist noch nicht dauerhaft gespeichert. ' +
                  'Du kannst erneut speichern oder ihn herunterladen.</div>'
                : '')) +
          (ergebnisMarken.length
            ? '<div class="verb-text">' + ergebnisMarken.length +
              ' Zeitmarke(n) werden als normale Notizen angelegt.</div>' : '') +
          (aufnahmeWarnung ? '<div class="meet-warn">' + esc(aufnahmeWarnung) + '</div>' : '');
      }
      if (phase === 'ausgewertet') {
        k.innerHTML = '<div class="meet-ok">✓ Ausgewertet: ' +
          (auswertung.zusammenfassung || []).length + ' Punkte, ' +
          (auswertung.entscheidungen || []).length + ' Entscheidungen, ' +
          (auswertung.aufgaben || []).length + ' Aufgaben.</div>' +
          (ergebnisRohBlob && E.audioBehalten() && !ergebnisAudio
            ? '<div class="meet-warn">Der Ton ist noch nicht dauerhaft gespeichert.</div>' : '');
      }
    };

    const fuss = (): void => {
      const f = o.querySelector('#mf');
      if (!f) return;
      if (phase === 'bereit')
        f.innerHTML = '<button data-a="los" class="prim">● Aufnahme starten</button>' +
                      '<button data-a="datei">Transkript laden</button>' +
                      '<button data-a="tippen">Text einfügen</button>' +
                      '<button data-a="einst">Einstellungen</button>' +
                      '<button data-a="zu">Schliessen</button>';
      if (phase === 'laeuft')
        f.innerHTML = '<input id="mmark" maxlength="120" placeholder="Zeitmarke benennen" ' +
                      'style="min-width:150px;flex:1">' +
                      '<button data-a="marke">＋ Zeitmarke</button>' +
                      '<button data-a="stopp" class="prim">■ Beenden</button>';
      if (phase === 'speichert')
        f.innerHTML = '<button disabled>Ton wird lokal gespeichert …</button>';
      if (phase === 'fertig') {
        const audioWerkzeuge =
          (ergebnisRohBlob && E.audioBehalten() && !ergebnisAudio
            ? '<button data-a="retryaudio">Mitschnitt erneut speichern</button>' : '') +
          (ergebnisRohBlob && !ergebnisAudio
            ? '<button data-a="ladeaudio">Mitschnitt herunterladen</button>' : '') +
          (E.sidecar() && (ergebnisRohBlob || ergebnisAudio)
            ? '<button data-a="sidecar">Sidecar-Transkript</button>' : '');
        f.innerHTML = '<button data-a="werten" class="prim">✨ Auswerten lassen</button>' +
                      '<button data-a="nurseite">Nur als Seite ablegen</button>' +
                      audioWerkzeuge +
                      '<button data-a="zu">Verwerfen</button>';
      }
      if (phase === 'ausgewertet') {
        const retten = ergebnisRohBlob && E.audioBehalten() && !ergebnisAudio
          ? '<button data-a="retryaudio">Mitschnitt erneut speichern</button>' +
            '<button data-a="ladeaudio">Mitschnitt herunterladen</button>'
          : '';
        f.innerHTML = '<button data-a="seite" class="prim">Seite anlegen</button>' +
                      retten +
                      '<button data-a="zu">Verwerfen</button>';
      }
    };

    const textFeld = (wert: any, lesbar: any): void => {
      const feld = o.querySelector('#mt');
      if (!feld) return;
      feld.innerHTML = lesbar
        ? `<div class="meet-vorschau">${esc(wert).replace(/\n/g, '<br>')}</div>`
        : `<textarea id="mtx" rows="10" placeholder="Hier steht das Transkript.">${esc(wert)}</textarea>`;
    };

    const audioSichern = async (): Promise<AudioAblage | null> => {
      if (!ergebnisRohBlob || !E.audioBehalten()) return null;
      if (audioSpeichert) throw new Error('Der Mitschnitt wird bereits gespeichert.');
      audioBlockId = audioBlockId || Store.uid();
      const vorher = phase;
      audioSpeichert = true;
      phase = 'speichert'; kopf(); fuss();
      try {
        ergebnisAudio = await audioAblegen(
          ergebnisRohBlob, ergebnisDauer, ergebnisMarken, audioBlockId);
        return ergebnisAudio;
      } finally {
        audioSpeichert = false;
        phase = vorher === 'ausgewertet' ? 'ausgewertet' : 'fertig';
        kopf(); fuss();
      }
    };

    const audioBlob = async (): Promise<Blob | null> => {
      if (ergebnisRohBlob) return ergebnisRohBlob;
      return ergebnisAudio ? Dateien.alsBlob(ergebnisAudio.dateiId) : null;
    };

    const aufnahmeUebernehmen = async (r: AufnahmeErgebnis | null, feldText = ''): Promise<void> => {
      if (!r) return;
      ergebnisDauer = r.dauer;
      ergebnisMarken = r.marken || [];
      ergebnisRohBlob = r.blob;
      aufnahmeWarnung = r.warnung || '';
      if (!r.blob && E.audioBehalten() && kannAufnehmen() && !aufnahmeWarnung)
        aufnahmeWarnung = 'Der Browser hat keine Audiodaten geliefert; das Transkript bleibt erhalten.';
      const browserText = transkriptText(r.transkript);
      /* Das sichtbare Feld enthält oft schon den letzten Interim-Satz; die
         Ergebnisliste dafür eventuell einen etwas späteren finalen Satz.
         Der längere Stand ist der weniger verlustreiche. */
      ergebnisText = String(feldText || '').trim().length >= browserText.trim().length
        ? (feldText || ergebnisText)
        : (browserText || ergebnisText);
      phase = 'fertig'; kopf(); fuss(); textFeld(ergebnisText, false);
      if (ergebnisRohBlob && E.audioBehalten()) {
        try { await audioSichern(); }
        catch (err) {
          UI.banner('Der Ton ist noch im Arbeitsspeicher, aber nicht dauerhaft abgelegt: ' +
            (err instanceof Error ? err.message : String(err)) +
            '. Erneut speichern oder herunterladen.', 'warn');
          phase = 'fertig'; kopf(); fuss();
        }
      }
    };

    const verwerfen = async (): Promise<void> => {
      if (audioSpeichert) {
        UI.toast('Der Mitschnitt wird noch gespeichert. Bitte einen Moment warten.');
        return;
      }
      if (laeuft) {
        if (!confirm('Aufnahme jetzt beenden? Der Mitschnitt bleibt zunächst im Fenster, damit nichts verloren geht.'))
          return;
        const feldText = o.querySelector<HTMLTextAreaElement>('#mtx')?.value || '';
        await aufnahmeUebernehmen(await stoppen(), feldText);
        return;
      }
      const hatInhalt = phase !== 'bereit' &&
        (!!ergebnisText.trim() || !!ergebnisRohBlob || !!ergebnisAudio);
      if (hatInhalt && !confirm('Besprechungsnotiz und noch nicht angelegte Aufnahme wirklich verwerfen?'))
        return;
      if (ergebnisAudio) {
        /* Erst schliessen, wenn auch die reservierte Datei weg ist. Ein
           Fehler bleibt sichtbar und erzeugt keinen stillen Waisen. */
        await Dateien.weg(ergebnisAudio.dateiId);
        ergebnisAudio = null;
      }
      ergebnisRohBlob = null;
      o.remove();
    };

    const audioFuerSeite = async (): Promise<AudioAblage | null> => {
      if (E.audioBehalten() && ergebnisRohBlob && !ergebnisAudio)
        await audioSichern();
      return E.audioBehalten() ? ergebnisAudio : null;
    };

    kopf(); fuss(); textFeld('', false);

    o.addEventListener('click', async e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) {
        try { await verwerfen(); }
        catch (err) {
          UI.banner('Die Aufnahme wurde nicht verworfen: ' +
            (err instanceof Error ? err.message : String(err)), 'warn');
        }
        return;
      }
      const b = elVon(e)?.closest<HTMLElement>('button[data-a]');
      if (!b) return;
      const a = b.dataset.a;

      try {
        if (a === 'einst') { einstellungenDialog(); return; }

        if (a === 'tippen') {
          phase = 'fertig'; ergebnisDauer = 0;
          kopf(); fuss(); textFeld('', false);
          o.querySelector<HTMLTextAreaElement>('#mtx')?.focus();
          return;
        }

        if (a === 'datei') {
          const inp = document.createElement('input');
          inp.type = 'file'; inp.accept = '.txt,.md,.vtt,.srt,text/plain';
          inp.addEventListener('change', async () => {
            const f = inp.files?.[0];
            if (!f) return;
            let t = await f.text();
            /* Untertitelformate von den Zeitmarken befreien */
            t = t.replace(/^WEBVTT.*$/gm, '')
                 .replace(/^\d+$/gm, '')
                 .replace(/^[\d:.,]+\s*-->.*$/gm, '')
                 .replace(/\n{3,}/g, '\n\n').trim();
            ergebnisText = t; ergebnisDauer = 0; phase = 'fertig';
            kopf(); fuss(); textFeld(t, false);
          });
          inp.click();
          return;
        }

        if (a === 'los') {
          await starten(
            (liste: any, teil: any) => {
              const el = o.querySelector<HTMLTextAreaElement>('#mtx');
              const t = transkriptText(liste) + (teil ? '\n[…] ' + teil : '');
              if (el) { el.value = t; el.scrollTop = el.scrollHeight; }
            },
            (sek: number) => { const u = o.querySelector('#muhr'); if (u) u.textContent = zeitText(sek); });
          phase = 'laeuft'; kopf(); fuss(); textFeld('', false);
          return;
        }

        if (a === 'marke') {
          const eingabe = o.querySelector<HTMLInputElement>('#mmark');
          const marke = markieren(eingabe?.value || '');
          if (!marke) throw new Error('Es läuft gerade keine Aufnahme.');
          kopf(); fuss();
          const u = o.querySelector('#muhr');
          if (u) u.textContent = zeitText(marke.sek);
          UI.toast('Zeitmarke bei ' + zeitText(marke.sek));
          return;
        }

        if (a === 'stopp') {
          const feldText = o.querySelector<HTMLTextAreaElement>('#mtx')?.value || '';
          await aufnahmeUebernehmen(await stoppen(), feldText);
          return;
        }

        if (a === 'retryaudio') {
          await audioSichern();
          UI.toast('Mitschnitt lokal gespeichert');
          return;
        }

        if (a === 'ladeaudio') {
          const blob = await audioBlob();
          if (!blob) throw new Error('Es gibt keinen Mitschnitt zum Herunterladen.');
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'Mitschnitt.' + audioEndung(blob.type);
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 10000);
          return;
        }

        if (a === 'sidecar') {
          const blob = await audioBlob();
          if (!blob) throw new Error('Es gibt keinen Mitschnitt zum Transkribieren.');
          const alterText = b.textContent || 'Sidecar-Transkript';
          (b as HTMLButtonElement).disabled = true;
          b.textContent = 'Wird transkribiert …';
          try {
            const text = await sidecarTranskribieren(blob);
            ergebnisText = text;
            textFeld(text, false);
            UI.toast('Transkript vom Sidecar übernommen');
          } finally {
            (b as HTMLButtonElement).disabled = false;
            b.textContent = alterText;
          }
          return;
        }

        if (a === 'werten') {
          ergebnisText = o.querySelector<HTMLTextAreaElement>('#mtx')?.value || ergebnisText;
          (b as HTMLButtonElement).disabled = true;
          const mt = o.querySelector('#mt');
          if (mt) mt.innerHTML = '<div class="agent-laeuft">Die KI liest mit …</div>';
          auswertung = await auswerten(ergebnisText, null);
          phase = 'ausgewertet'; kopf(); fuss();
          if (mt) mt.innerHTML =
            '<div class="meet-vorschau">' +
            '<b>' + esc(auswertung.titel || 'Besprechung') + '</b><br><br>' +
            (auswertung.zusammenfassung || []).map((x: any) => '• ' + esc(x)).join('<br>') +
            ((auswertung.entscheidungen || []).length
              ? '<br><br><b>Entscheidungen</b><br>' +
                auswertung.entscheidungen.map((x: any) => '„' + esc(x) + '"').join('<br>') : '') +
            ((auswertung.aufgaben || []).length
              ? '<br><br><b>Aufgaben</b><br>' +
                auswertung.aufgaben.map((x: any) => '☐ ' + esc(x.was || x) +
                  (x.wer ? ' — ' + esc(x.wer) : '')).join('<br>') : '') +
            '</div>';
          return;
        }

        if (a === 'nurseite') {
          ergebnisText = o.querySelector<HTMLTextAreaElement>('#mtx')?.value || ergebnisText;
          const audio = await audioFuerSeite();
          const p = seiteAnlegen({ titel: 'Besprechung', zusammenfassung: [], aufgaben: [] },
                                 ergebnisText, ergebnisDauer, audio);
          ergebnisAudio = null;
          ergebnisRohBlob = null;
          o.remove(); App.oeffne(p.id);
          UI.toast('Als Seite abgelegt');
          return;
        }

        if (a === 'seite') {
          const audio = await audioFuerSeite();
          const p = seiteAnlegen(auswertung, ergebnisText, ergebnisDauer, audio);
          ergebnisAudio = null;
          ergebnisRohBlob = null;
          o.remove(); App.oeffne(p.id);
          UI.toast('Besprechungsnotiz angelegt');
          return;
        }
      } catch (err: unknown) {
        UI.banner('Besprechung: ' + (err instanceof Error ? err.message : String(err)), 'warn');
        (b as HTMLButtonElement).disabled = false;
      }
    });
  };

  const einstellungenDialog = () => {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = '<div class="finder" style="width:min(520px,94vw)">' +
      '<div class="fh">🎙 Einstellungen für Besprechungen<button class="icon-btn" data-a="zu">✕</button></div>' +
      '<div style="padding:16px 18px; display:flex; flex-direction:column; gap:14px">' +
        '<label style="display:flex;gap:10px;align-items:center;font-size:14px">' +
          `<input type="checkbox" id="ma"${E.audioBehalten() ? ' checked' : ''}> ` +
          'Aufnahme behalten<br></label>' +
        '<div class="verb-text" style="margin:-8px 0 0">Die Tondatei liegt dann in der Seite. ' +
          'Ausgeschaltet wird nur der Text behalten — das spart viel Platz.</div>' +
        '<label style="display:flex;gap:10px;align-items:center;font-size:14px">' +
          `<input type="checkbox" id="mtw"${E.transkriptLoeschen() ? ' checked' : ''}> ` +
          'Transkript nach der Auswertung löschen</label>' +
        '<div class="verb-text" style="margin:-8px 0 0">Dann bleibt nur die Zusammenfassung — ' +
          'gut, wenn das Wortprotokoll niemanden etwas angeht.</div>' +
        '<label>Sprache der Erkennung<br><select id="ms">' +
          ['de-DE','de-CH','de-AT','en-US','en-GB','tr-TR','fr-FR','it-IT','es-ES']
            .map(s => `<option${E.sprache() === s ? ' selected' : ''}>${s}</option>`).join('') +
        '</select></label>' +
        '<label>Optionaler Transkriptionsdienst<br>' +
          `<input id="mts" type="url" value="${esc(E.sidecar())}" ` +
          'placeholder="http://127.0.0.1:…/transcribe" style="width:100%"></label>' +
        '<div class="verb-text" style="margin:-8px 0 0">Diese Adresse wird nie automatisch ' +
          'aufgerufen. Nach einer Aufnahme erscheint ein eigener Knopf; erst nach deiner ' +
          'Bestätigung wird der Ton an diesen Dienst gesendet.</div>' +
      '</div>' +
      '<div class="fbtns"><button data-a="zu" class="prim">Fertig</button></div></div>';
    document.body.appendChild(o);
    const uebernehmen = () => {
      const ma = o.querySelector<HTMLInputElement>('#ma');
      const mtw = o.querySelector<HTMLInputElement>('#mtw');
      const ms = o.querySelector<HTMLSelectElement>('#ms');
      const mts = o.querySelector<HTMLInputElement>('#mts');
      if (ma) Store.setMeta('meet:audio', ma.checked);
      if (mtw) Store.setMeta('meet:transkriptWeg', mtw.checked);
      if (ms) Store.setMeta('meet:sprache', ms.value);
      if (mts) Store.setMeta('meet:sidecar', mts.value.trim());
    };
    o.addEventListener('change', uebernehmen);
    o.addEventListener('click', e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) {
        uebernehmen();
        o.remove();
      }
    });
  };

  /**
   * Der Besprechungs-Reiter der Seitenleiste. Notion zeigt oben, was ansteht,
   * darunter die heutigen Notizen — mit einem Weg zum Kalender, wenn keiner
   * verbunden ist.
   */
  const seitenleiste = (baum: any) => {
    const abschnitt = (name: string) => {
      const d = document.createElement('div');
      d.className = 'side-section';
      d.innerHTML = `<span>${name}</span>`;
      return d;
    };

    baum.appendChild(abschnitt('Bevorstehend'));
    const kommend = App.kommendeTermine(5);
    const oben = document.createElement('div');
    oben.className = 'wz-block';
    if (kommend.length) {
      oben.innerHTML = kommend.map((t: any) =>
        `<button class="side-item" data-t="${t.id}"><span>📌</span>` +
        `<span>${esc(t.text)}</span><span class="k">${esc(t.wann)}</span></button>`).join('');
    } else {
      oben.innerHTML =
        '<button class="side-item" data-a="kal"><span>📅</span>' +
        '<span>Verbinde deinen Kalender</span></button>' +
        '<div class="side-leer">Dann stehen hier alle Termine und du kannst ' +
        'für jeden eine Notiz anlegen.</div>';
    }
    oben.addEventListener('click', e => {
      const t = elVon(e)?.closest<HTMLElement>('[data-t]');
      if (t) { App.oeffne(t.dataset.t); return; }
      if (elVon(e)?.closest<HTMLElement>('[data-a="kal"]')) Kalender.dialog();
    });
    baum.appendChild(oben);

    baum.appendChild(abschnitt('Heute'));
    const unten = document.createElement('div');
    unten.className = 'wz-block';
    /* Alle Seiten, die aus einer Besprechung entstanden sind */
    const notizen = Object.values<any>(Store.cache.blocks)
      .filter(b => b.type === 'page' && b.alive !== false && b.besprechung)
      .sort((a, b) => String(b.created).localeCompare(String(a.created)))
      .slice(0, 8);
    /* IST HIER GAR NICHTS, steht der leere Zustand statt der Liste — mit
       der einen Handlung, die es an dieser Stelle gibt. Eine graue Zeile
       unter einem „＋"-Knopf sagt weniger als beides zusammen. */
    unten.innerHTML = notizen.length
      ? '<button class="side-item" data-a="neu"><span>＋</span><span>Neue Meeting-Notiz</span></button>' +
        notizen.map(p => `<button class="side-item" data-p="${p.id}"><span>${p.icon || '🎙'}</span>` +
            `<span>${esc(p.text || 'Ohne Titel')}</span></button>`).join('')
      : Hinweis.leer({
          zeichen: '🎙',
          gross: 'Noch keine Besprechung',
          klein: 'Rede mit, statt mitzuschreiben — Redion hört zu und legt ' +
                 'daraus eine Notiz an. Die Aufnahme bleibt auf diesem Gerät.',
          handlung: 'Neue Meeting-Notiz',
          daten: 'data-a="neu"'
        });
    unten.addEventListener('click', e => {
      if (elVon(e)?.closest<HTMLElement>('[data-a="neu"]')) { panel(); return; }
      const p = elVon(e)?.closest<HTMLElement>('[data-p]');
      if (p) App.oeffne(p.dataset.p);
    });
    baum.appendChild(unten);
  };

  return { starten, stoppen, markieren, auswerten, seiteAnlegen, aufgabenDatenbank,
           audioAblegen, sidecarTranskribieren,
           transkriptText, zeitText, kannZuhoeren, kannAufnehmen,
           panel, einstellungenDialog, seitenleiste, E };
})();

(window as any).Meeting = Meeting;
