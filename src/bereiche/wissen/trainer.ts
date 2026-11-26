/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/wissen/trainer.ts (npm run bauen:ts). */
/* ══ DER TRAINER — Boxen, Auswahl-, Schreib- und Lückenaufgaben (E677) ═══
   Redur, 21. September 2026: „jetzt will ich eine flüssige lern app im
   redion bauen nicht die karten sollte im bereichen sein sondern direkt
   eine app dort … ich will so boxen haben die ich weiss sollte selten
   vorkommen und die ich nicht weiss mehrmals auch schreiben und multiple
   choice". Und dazu: „es sollte direkt mit redion verbunden sein die app
   nicht getrennt".

   DESHALB IST DER TRAINER KEIN ZWEITER SPEICHER. Seine Aufgaben sind
   gewöhnliche Lernkarten (`type: 'flashcard'`) auf einer Seite — mit einem
   Feld `quiz`, das sagt, wie gefragt wird: `mc` (mehrere Antworten können
   richtig sein, wie in der Prüfung), `schreiben` (eigene Antwort, dann die
   Musterlösung und die Selbsteinschätzung) oder `luecke` (getippt,
   nachsichtig verglichen). Der Fortschritt steht am Block in `sr` und
   `reviewVerlauf`, geschrieben allein von `WissenDienst.planen` — dieselbe
   Rechnung, die die Tagesrunde, das Fehlertraining und die Kennzahlen
   lesen. Eine Karte, die hier sitzt, sitzt überall; sie reist in `.json`,
   `.redion`, in die Wolke und in den zweiten Tab, ohne dass dieser Bereich
   etwas dafür tut (§9, §17).

   DIE BOXEN sind eine ABLEITUNG, kein zweiter Plan: eine Karte ohne `sr`
   ist „neu", sonst ist ihre Box `min(5, sr.wdh + 1)` — wie oft sie zuletzt
   hintereinander gewusst wurde. SM-2 (oder FSRS, je nach Schalter) setzt
   die Abstände: Gewusstes kommt in Tagen und Wochen wieder, Nichtgewusstes
   sofort. Und in einer Runde kommt eine falsch beantwortete Karte nach drei
   anderen NOCH EINMAL, höchstens zweimal — man sieht, was man nicht weiss,
   mehrmals, bevor die Runde zu Ende ist. Was man wusste, kommt in der
   Runde nicht wieder.

   Der Inhalt (das Staatskunde-Kapitel) ist eine Vorlage in
   `Register.vorlagen` und wird beim ersten Öffnen als Seite angelegt —
   Nutzerdaten, sichtbar, veränderbar, sicherbar (§2). Der Trainer kennt
   kein Kapitel beim Namen: er nimmt jede Lernkarte mit `quiz`.

   Alles, was aus einer Karte in HTML geht, läuft durch `esc` (§19). */

const Trainer = (() => {
  const BOXEN = 5;
  const RUNDE_HOECHSTENS = 20;
  const NOCHMAL_NACH = 3;
  const NOCHMAL_HOECHSTENS = 2;
  const NOTE_RICHTIG = 3;          /* Gut — nicht Leicht: ein Ankreuztreffer hebt die Leichtigkeit nicht */
  const NOTE_FALSCH = 1;

  const esc = (wert: unknown): string => String(wert ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  type Karte = any;
  type Runde = {
    name: string;
    reihenfolge: string[];
    index: number;
    nochmal: Record<string, number>;
    richtig: number;
    falsch: number;
    begonnen: string;
  };
  type Zustand = {
    ziel: HTMLElement | null;
    aktor: string;
    runde: Runde | null;
    gewaehlt: Set<number>;
    geprueft: boolean;
    aufgedeckt: boolean;
  };
  const zustand: Zustand = { ziel: null, aktor: 'ich', runde: null, gewaehlt: new Set(), geprueft: false, aufgedeckt: false };

  /* ── Die Karten und ihre Boxen ────────────────────────────────────────── */
  /* In SEITENREIHENFOLGE, nicht nach `created`: eine Vorlage legt sechzig
     Karten in derselben Millisekunde an, und `created` allein hätte die
     sieben Prüfungsfragen in beliebiger Folge gebracht. Die Reihenfolge
     auf der Seite ist die, die der Mensch sieht und ändern kann. */
  const ordnung = (k: Karte): string => {
    const eltern = (typeof Store !== 'undefined' && k?.parentId) ? Store.getBlock(k.parentId) : null;
    const i = Array.isArray(eltern?.content) ? eltern.content.indexOf(k.id) : -1;
    return String(eltern?.created || k?.created || '') + '#' + String(i < 0 ? 999999 : i).padStart(6, '0');
  };
  const karten = (): Karte[] => {
    const alle: Karte[] = (typeof Learning !== 'undefined' && Learning.cards) ? Learning.cards() : [];
    return alle
      .filter(k => k && k.quiz && typeof k.quiz === 'object' && typeof k.quiz.kind === 'string')
      .sort((a, b) => ordnung(a).localeCompare(ordnung(b)));
  };
  const boxVon = (k: Karte): number | 'neu' => {
    if (!k?.sr || typeof k.sr !== 'object') return 'neu';
    return Math.min(BOXEN, (Number(k.sr.wdh) || 0) + 1);
  };
  const boxRang = (k: Karte): number => { const b = boxVon(k); return b === 'neu' ? 0 : b; };
  const istFaellig = (k: Karte): boolean => {
    const f = k?.sr?.faellig;
    if (!f) return true;
    const t = new Date(String(f)).getTime();
    return !Number.isFinite(t) || t <= Date.now();
  };
  /* Der Name eines Themas steht an der Karte (`quiz.topic`), nicht in einem
     Inhaltsmodul: der Trainer kennt kein Kapitel beim Namen (E679). */
  const themaName = (id: string): string => {
    const k = karten().find(x => String(x.quiz.thema || '') === id && typeof x.quiz.topic === 'string' && x.quiz.topic);
    return k ? String(k.quiz.topic) : id;
  };
  /** Zu welchem Kapitel eine Karte gehört — Karten aus E677 tragen das Feld noch nicht. */
  const kapitelVon = (k: Karte): string => String(k?.quiz?.kapitel || 'Staatskunde — Leben in der Schweiz');
  /** Eine Prüfungsfrage: ausdrücklich so markiert — oder eine Schreibaufgabe, die es nicht ausdrücklich verneint (E677). */
  const istPruefung = (k: Karte): boolean => k.quiz.pruefung === true || (k.quiz.kind === 'schreiben' && k.quiz.pruefung !== false);
  /** Die Vorlagen, die ein Kapitel für den Trainer bauen (`trainer: true`), und ob es schon eine Seite daraus gibt. */
  const kapitelVorlagen = (): Array<{ id: string; name: string; angelegt: boolean }> => {
    const reg = (globalThis as any).Register;
    let alle: any[] = [];
    try { alle = reg?.vorlagen?.alle?.() || []; } catch { alle = []; }
    const bloecke: any[] = (typeof Store !== 'undefined' && Store.cache?.blocks) ? Object.values(Store.cache.blocks) : [];
    return alle.filter(v => v && v.trainer === true && typeof v.id === 'string').map(v => ({
      id: String(v.id), name: String(v.name || v.id),
      angelegt: bloecke.some(b => b && b.type === 'page' && b.alive !== false && b.vorlage === v.id)
    }));
  };
  const artName = (kind: string): string => kind === 'mc' ? 'Multiple Choice' : kind === 'schreiben' ? 'Schreiben' : 'Lücke';
  const frageVon = (k: Karte): string => {
    const text = String(k?.text || '');
    if (k?.quiz?.kind === 'luecke') return text;
    const i = text.indexOf('::');
    return (i >= 0 ? text.slice(0, i) : text).trim();
  };
  /* Nachsichtiger Vergleich für die Lücke: Gross/klein, Umlaute, Satzzeichen, Leerraum. */
  const normal = (s: string): string => String(s || '').toLowerCase()
    .replace(/ß/g, 'ss').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
    .replace(/[^a-z0-9]+/g, ' ').trim();
  const mischen = <T,>(a: T[]): T[] => {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j]!, b[i]!]; }
    return b;
  };


  type MatchPaar = {frage:string;antwort:string};
  type MatchRunde = {kapitel:string;paare:MatchPaar[];links:number[];rechts:number[];wahl:{seite:string;index:number}|null;fertig:Set<number>;fehler:number;beginn:number;sekunden:number;meldung:string};
  let matchRunde: MatchRunde | null = null;
  const matchPaare = (karten: Karte[]): MatchPaar[] => {
    const roh = karten.filter(k => k.quiz?.kind === 'schreiben' && k.quiz?.format === 'flashcard' && !k.quiz.image)
      .map(k => ({frage:frageVon(k),antwort:String(k.quiz.musterloesung?.[0] || '').trim()}))
      .filter(p => p.frage && p.antwort && p.frage.length <= 160 && p.antwort.length <= 100);
    const norm = (s: string) => s.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
    // Both sides must be unambiguous: no repeated question or answer.
    const fragen = new Map<string,number>(), antworten = new Map<string,number>();
    for (const p of roh) {
      const f=norm(p.frage), a=norm(p.antwort);
      fragen.set(f,(fragen.get(f)||0)+1);
      antworten.set(a,(antworten.get(a)||0)+1);
    }
    return roh.filter(p=>fragen.get(norm(p.frage))===1 && antworten.get(norm(p.antwort))===1);
  };
  const matchStart = (kapitel: string) => {
    const paare=mischen(matchPaare(karten().filter(k=>kapitelVon(k)===kapitel))).slice(0,6);
    if(paare.length<3){start();return;}
    const ids=paare.map((_,i)=>i);
    zustand.runde=null;
    matchRunde={kapitel,paare,links:mischen(ids),rechts:mischen(ids),wahl:null,fertig:new Set(),fehler:0,beginn:Date.now(),sekunden:0,meldung:'Wähle eine Frage und die passende Antwort.'};
    matchZeige();
  };
  const matchZeige = () => {
    const ziel=zustand.ziel,r=matchRunde;
    if(!ziel||!r)return;
    if(r.fertig.size===r.paare.length){
      ziel.innerHTML=`<section class="lw-trainer-match"><header class="lw-section-head"><h2>Match abgeschlossen</h2><p>${esc(r.kapitel)}</p></header>
        <div class="lw-training-result"><h2>${r.paare.length} / ${r.paare.length} Paare</h2><p>${r.sekunden} Sekunden · ${r.fehler} Fehlversuche</p></div>
        <div class="lw-trainer-reihe">${knopf('Zur Übersicht','data-tr-zurueck')}${knopf('Nochmal spielen',`data-tr-start="match" data-kapitel="${esc(r.kapitel)}"`,'is-primary')}</div></section>`;
      ziel.querySelector<HTMLElement>('[data-tr-zurueck]')?.focus();
      return;
    }
    const spalte=(seite: 'links'|'rechts',ids: number[])=>ids.map(i=>{
      const fertig=r.fertig.has(i), aktiv=r.wahl?.seite===seite&&r.wahl.index===i;
      const p=r.paare[i]!;
      return `<button type="button" class="lw-match-kachel${fertig?' is-fertig':''}" data-tr-match="${seite}" data-index="${i}" aria-pressed="${aktiv}" ${fertig?'disabled':''}>${esc(seite==='links'?p.frage:p.antwort)}${fertig?' <span aria-label="Zugeordnet">✓</span>':''}</button>`;
    }).join('');
    ziel.innerHTML=`<section class="lw-trainer-match"><header class="lw-session-head"><div><p>Match</p><h2>${esc(r.kapitel)}</h2></div>${knopf('Beenden','data-tr-zurueck')}</header>
      <progress max="${r.paare.length}" value="${r.fertig.size}" aria-label="Zugeordnete Paare"></progress>
      <p class="lw-trainer-hinweis">${r.fertig.size} von ${r.paare.length} Paaren · ${r.fehler} Fehlversuche</p>
      <div class="lw-match-grid"><div class="lw-match-spalte"><h3>Fragen</h3>${spalte('links',r.links)}</div><div class="lw-match-spalte"><h3>Antworten</h3>${spalte('rechts',r.rechts)}</div></div>
      <p class="lw-match-meldung" role="status" aria-live="polite">${esc(r.meldung)}</p></section>`;
  };
  const matchWahl = (seite: string,index: number) => {
    const r=matchRunde,ziel=zustand.ziel;
    if(!r||!ziel||!['links','rechts'].includes(seite)||!Number.isInteger(index)||index<0||index>=r.paare.length||r.fertig.has(index))return;
    if(!r.wahl||r.wahl.seite===seite){
      r.wahl=r.wahl?.index===index&&r.wahl.seite===seite?null:{seite,index};
      r.meldung=r.wahl?'Wähle das passende Gegenstück.':'Wähle eine Frage oder Antwort.';
    }else{
      if(r.wahl.index===index){
        r.fertig.add(index);r.meldung='Richtig zugeordnet.';
        if(r.fertig.size===r.paare.length)r.sekunden=Math.max(0,Math.floor((Date.now()-r.beginn)/1000));
      }else{r.fehler++;r.meldung='Das passt nicht. Versuche es erneut.';}
      r.wahl=null;
    }
    matchZeige();
    if(r.fertig.size===r.paare.length)return;
    const andere=seite==='links'?'rechts':'links';
    const focusSelector=r.wahl?`[data-tr-match="${andere}"]:not(:disabled)`:`[data-tr-match="${seite}"]:not(:disabled)`;
    ziel.querySelector<HTMLElement>(focusSelector)?.focus({preventScroll:true});
  };

  /** Welche Karten eine Runde meint. */
  const aufgabenVon = (name: string): Karte[] => {
    const alle = karten();
    if (name === 'pruefung') return alle.filter(istPruefung);
    if (name.startsWith('pruefung:')) return alle.filter(k => istPruefung(k) && kapitelVon(k) === name.slice(9));
    if (name.startsWith('kapitel:')) return alle.filter(k => kapitelVon(k) === name.slice(8));
    if (name.startsWith('test:')) return alle.filter(k => kapitelVon(k) === name.slice(5));
    if (name.startsWith('thema:')) return alle.filter(k => String(k.quiz.thema || '') === name.slice(6));
    if (name.startsWith('art:')) return alle.filter(k => String(k.quiz.kind) === name.slice(4));
    return alle;
  };
  /** Die Reihenfolge einer Runde: Fällige zuerst, schwächste Box zuerst; die Prüfung in Seitenreihenfolge. */
  const warteschlange = (name: string, aufgaben: Karte[]): Karte[] => {
    if (name === 'pruefung' || name.startsWith('pruefung:')) return aufgaben;
    if (name.startsWith('test:')) return mischen(aufgaben).slice(0, RUNDE_HOECHSTENS);
    const faellig = mischen(aufgaben.filter(istFaellig)).sort((a, b) => boxRang(a) - boxRang(b));
    const rest = mischen(aufgaben.filter(k => !istFaellig(k))).sort((a, b) => boxRang(a) - boxRang(b));
    return faellig.concat(rest).slice(0, RUNDE_HOECHSTENS);
  };

  /* ── Die angefangene Runde überlebt ein Neuladen ──────────────────────── */
  const rundeSchluessel = (): string => 'lernen:' + zustand.aktor + ':runde';
  const rundeMerken = (): void => {
    if (typeof Store === 'undefined') return;
    try {
      if (zustand.runde) Store.setMeta(rundeSchluessel(), { ...zustand.runde });
      else Store.setMeta(rundeSchluessel(), null);
    } catch { /* nur diese Sitzung */ }
  };
  const gemerkteRunde = (): Runde | null => {
    if (typeof Store === 'undefined') return null;
    const roh = Store.getMeta(rundeSchluessel());
    if (!roh || typeof roh !== 'object' || !Array.isArray(roh.reihenfolge)) return null;
    const ids = roh.reihenfolge.filter((x: unknown) => typeof x === 'string');
    const index = Math.max(0, Math.min(ids.length, Number(roh.index) || 0));
    if (!ids.length || index >= ids.length) return null;
    return { name: String(roh.name || 'lernen'), reihenfolge: ids, index, nochmal: (roh.nochmal && typeof roh.nochmal === 'object') ? roh.nochmal : {},
      richtig: Number(roh.richtig) || 0, falsch: Number(roh.falsch) || 0, begonnen: String(roh.begonnen || '') };
  };

  /* ── Zeichnen ─────────────────────────────────────────────────────────── */
  const knopf = (text: string, attr: string, klasse = ''): string =>
    `<button type="button"${klasse ? ` class="${klasse}"` : ''} ${attr}>${esc(text)}</button>`;
  const sym = (name: string): string => {
    const reg = (globalThis as any).Register;
    return reg?.symbole?.hat?.(name) ? `<span data-sym="${esc(name)}" aria-hidden="true"></span>` : '';
  };
  const fuelle = (): void => {
    const reg = (globalThis as any).Register;
    try { if (zustand.ziel && reg?.symbole?.fuelle) reg.symbole.fuelle(zustand.ziel); } catch { /* ohne Symbole */ }
  };

  const boxenZeile = (alle: Karte[]): string => {
    const zaehler: Record<string, number> = { neu: 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    alle.forEach(k => { zaehler[String(boxVon(k))] = (zaehler[String(boxVon(k))] || 0) + 1; });
    const felder: Array<[string, string, string]> = [['neu', 'Neu', 'noch nie'], ['1', 'Box 1', 'nicht gewusst'], ['2', 'Box 2', '1× gewusst'],
      ['3', 'Box 3', '2× gewusst'], ['4', 'Box 4', '3× gewusst'], ['5', 'Box 5', 'sitzt']];
    return `<div class="lw-trainer-boxen" aria-label="Boxen">${felder.map(([id, name, was]) =>
      `<div class="lw-trainer-box" data-box="${id}"><div class="lw-trainer-box-zahl">${zaehler[id] || 0}</div><div class="lw-trainer-box-name">${name}</div><div class="lw-trainer-box-was">${was}</div></div>`).join('')}</div>`;
  };

  const start = (): void => {
    const ziel = zustand.ziel;
    if (!ziel) return;
    zustand.runde = null;
    matchRunde = null;
    const alle = karten();
    /* Kapitel, die es als Vorlage gibt und noch nicht als Seite: ein Knopf je
       Kapitel — auch dann, wenn schon eines liegt (E679). */
    const offen = kapitelVorlagen().filter(v => !v.angelegt);
    const anlegen = offen.length
      ? `<h3 class="lw-trainer-h3">Kapitel anlegen</h3><div class="lw-trainer-reihe">${offen.map((v, i) =>
          knopf(`Kapitel «${v.name}» anlegen`, `data-tr-anlegen="${esc(v.id)}"`, i === 0 && !alle.length ? 'is-primary' : '')).join('')}</div>
        <p class="lw-trainer-hinweis">Ein Kapitel wird als Seite mit Lernkarten angelegt — du kannst jede Karte dort lesen und ändern.</p>`
      : '';
    if (!alle.length) {
      ziel.innerHTML = `<section class="lw-trainer-start"><header class="lw-section-head"><h2>${sym('medal')}Trainer</h2>
        <p>Boxen, Auswahl-, Schreib- und Lückenaufgaben — Kapitel für Kapitel. Noch liegt kein Kapitel hier.</p></header>
        ${anlegen}</section>`;
      fuelle();
      return;
    }
    const faellig = alle.filter(istFaellig).length;
    const gemerkt = gemerkteRunde();
    const kapitel = Array.from(new Set(alle.map(kapitelVon)));
    /* Je Kapitel: die Prüfung der Reihe nach, dann die Themen. */
    const kapitelBloecke = kapitel.map(kap => {
      const zu = alle.filter(k => kapitelVon(k) === kap);
      const themen = Array.from(new Set(zu.map(k => String(k.quiz.thema || '')).filter(Boolean)));
      const pruefung = aufgabenVon('pruefung:' + kap).length;
      const sitztKap = zu.filter(k => boxRang(k) >= 4).length;
      const faelligKap = zu.filter(istFaellig).length;
      const neuKap = zu.filter(k => !k.sr).length;
      const fachNamen = Array.from(new Set(zu.map(k => String(k.quiz.subject || '')).filter(Boolean)));
      return `<section class="lw-trainer-kapitel" data-tr-kapitel="${esc(kap)}"><h3 class="lw-trainer-h3">${esc(kap)} · ${sitztKap}/${zu.length} sitzen</h3>
        <p class="lw-trainer-hinweis">${fachNamen.length ? esc(fachNamen.join(' · ')) + ' · ' : ''}${zu.length} Karten · ${neuKap} neu · ${faelligKap} fällig</p>
        <progress max="${zu.length}" value="${sitztKap}" aria-label="Sichere Karten im Set"></progress>
        <div class="lw-trainer-reihe">
          ${knopf(`Lernen — ${zu.length} Aufgaben`, `data-tr-start="kapitel" data-kapitel="${esc(kap)}"`)}
          ${knopf(`Test — ${Math.min(zu.length, RUNDE_HOECHSTENS)} Fragen`, `data-tr-start="test" data-kapitel="${esc(kap)}"`)}
          ${matchPaare(zu).length>=3?knopf('Match — Paare zuordnen',`data-tr-start="match" data-kapitel="${esc(kap)}"`):''}

          ${pruefung ? knopf(`Prüfung üben — ${pruefung} Fragen der Reihe nach`, `data-tr-start="pruefung" data-kapitel="${esc(kap)}"`) : ''}
        </div>
        ${themen.length ? `<div class="lw-trainer-reihe">${themen.map(t => {
          const zuT = zu.filter(k => String(k.quiz.thema || '') === t);
          const sitzt = zuT.filter(k => boxRang(k) >= 4).length;
          return knopf(`${themaName(t)} · ${sitzt}/${zuT.length} sitzen`, `data-tr-start="thema" data-thema="${esc(t)}"`);
        }).join('')}</div>` : ''}</section>`;
    }).join('');
    ziel.innerHTML = `<section class="lw-trainer-start">
      <header class="lw-section-head"><h2>${sym('medal')}Trainer</h2>
        <p>${alle.length} Aufgaben · ${faellig ? `<b>${faellig}</b> heute fällig` : 'heute nichts fällig — alles sitzt'}${gemerkt ? ` · eine Runde ist angefangen (Karte ${gemerkt.index + 1} von ${gemerkt.reihenfolge.length})` : ''}</p></header>
      ${boxenZeile(alle)}
      <div class="lw-trainer-reihe">
        ${knopf(gemerkt && gemerkt.name === 'lernen' ? 'Runde fortsetzen' : (faellig ? 'Lernen — Fällige zuerst' : 'Lernen — alle Kapitel'), 'data-tr-start="lernen"', 'is-primary')}
      </div>
      ${kapitelBloecke}
      ${anlegen}
      <h3 class="lw-trainer-h3">Nach Aufgabenform</h3>
      <div class="lw-trainer-reihe">
        ${knopf('Nur Multiple Choice', 'data-tr-start="art" data-art="mc"')}
        ${knopf('Nur Schreiben', 'data-tr-start="art" data-art="schreiben"')}
        ${knopf('Nur Lücken', 'data-tr-start="art" data-art="luecke"')}
      </div>
      <p class="lw-trainer-hinweis">Tasten: Enter prüft und geht weiter · 1–4 bewerten nach dem Aufdecken · Escape beendet die Runde (sie bleibt gemerkt).</p>
    </section>`;
    fuelle();
  };

  /* ── Die Runde ────────────────────────────────────────────────────────── */
  const rundeStarten = (name: string): void => {
    const gemerkt = gemerkteRunde();
    if (gemerkt && gemerkt.name === name && gemerkt.reihenfolge.every(id => typeof Store !== 'undefined' && Store.getBlock(id))) {
      zustand.runde = gemerkt;
    } else {
      const reihe = warteschlange(name, aufgabenVon(name));
      if (!reihe.length) { start(); return; }
      zustand.runde = { name, reihenfolge: reihe.map(k => String(k.id)), index: 0, nochmal: {}, richtig: 0, falsch: 0, begonnen: new Date().toISOString() };
    }
    zustand.gewaehlt = new Set(); zustand.geprueft = false; zustand.aufgedeckt = false;
    rundeMerken();
    zeige();
  };

  const aktuelleKarte = (): Karte | null => {
    const r = zustand.runde;
    if (!r) return null;
    const id = r.reihenfolge[r.index];
    if (!id || typeof Store === 'undefined') return null;
    const k = Store.getBlock(id);
    return k && k.alive !== false && k.quiz ? k : null;
  };

  const kopf = (k: Karte): string => {
    const r = zustand.runde!;
    const b = boxVon(k);
    return `<header class="lw-session-head lw-trainer-kopf"><div><p>${esc(r.name.startsWith('test:') ? 'Test' : r.name.startsWith('pruefung') ? 'Prüfung üben' : 'Lernen')}</p>
      <h2>Karte ${r.index + 1} von ${r.reihenfolge.length}</h2></div>${knopf('Beenden', 'data-tr-ende')}</header>
      <progress max="${r.reihenfolge.length}" value="${r.index}" aria-label="Fortschritt der Runde"></progress>
      <div class="lw-trainer-marken"><span class="lw-trainer-marke">${esc(themaName(String(k.quiz.thema || '')))}</span>
      <span class="lw-trainer-marke">${esc(artName(String(k.quiz.kind)))}</span>
      <span class="lw-trainer-marke lw-trainer-marke-box">${b === 'neu' ? 'Neu' : 'Box ' + b}</span>
      ${k.quiz.nummer && k.quiz.kind !== 'schreiben' ? `<span class="lw-trainer-marke lw-trainer-nummer">${esc(k.quiz.nummer)}</span>` : ''}
      ${k.quiz.quelle ? `<span class="lw-trainer-quelle">${esc(k.quiz.quelle)}</span>` : ''}</div>`;
  };

  const zeige = (): void => {
    const ziel = zustand.ziel;
    const r = zustand.runde;
    if (!ziel || !r) return;
    const k = aktuelleKarte();
    if (!k) {
      /* Eine gelöschte Karte wird übersprungen; ist nichts mehr da, ist die Runde zu Ende. */
      if (r.index < r.reihenfolge.length) { r.index++; rundeMerken(); zeige(); return; }
      ende(); return;
    }
    const kind = String(k.quiz.kind);
    let rumpf = '';
    if (kind === 'mc') {
      const optionen: Array<{ text: string; richtig: boolean }> = Array.isArray(k.quiz.optionen) ? k.quiz.optionen : [];
      /* Die Antworten werden bei JEDER Anzeige gemischt (E680). Gespeichert
         stehen die richtigen meist zuerst — wer das einmal gesehen hat,
         kreuzt a) b) c) an und lernt nichts. `data-tr-option` bleibt der
         gespeicherte Platz, die Buchstaben folgen der Anzeige. */
      const reihenfolge = mischen(optionen.map((_, i) => i));
      rumpf = `<h3 class="lw-trainer-frage">${esc(frageVon(k))}</h3>
        <p class="lw-trainer-anweisung">${k.quiz.format === 'single_select' || k.quiz.format === 'true_false' ? 'Wähle eine Antwort.' : 'Wähle alle richtigen Antworten.'}</p>
        <div class="lw-trainer-optionen">${reihenfolge.map((i, platz) =>
          `<label class="lw-trainer-option"><input type="${k.quiz.format === 'single_select' || k.quiz.format === 'true_false' ? 'radio' : 'checkbox'}" name="redion-trainer-option" data-tr-option="${i}"><span class="lw-trainer-option-text"><b>${'abcdefgh'[platz] ?? ''})</b> ${esc(optionen[i]?.text ?? '')}</span></label>`).join('')}</div>
        <div class="lw-trainer-ergebnis" aria-live="polite"></div>
        <div class="lw-rating lw-trainer-fuss">${knopf('Prüfen', 'data-tr-pruefen', 'is-primary')}</div>`;
    } else if (kind === 'schreiben') {
      rumpf = `<h3 class="lw-trainer-frage">${k.quiz.nummer ? `<span class="lw-trainer-nummer">${esc(k.quiz.nummer)}</span> ` : ''}${esc(frageVon(k))}</h3>
        ${k.quiz.format === 'flashcard' ? '<p class="lw-trainer-anweisung">Denke an die Antwort und decke die Karte auf.</p>' : `<textarea class="lw-trainer-antwort" data-tr-antwort rows="4" placeholder="Antwort in eigenen Worten …" aria-label="Deine Antwort"></textarea>`}
        <div class="lw-trainer-ergebnis" aria-live="polite"></div>
        <div class="lw-rating lw-trainer-fuss">${knopf(k.quiz.format === 'flashcard' ? 'Antwort anzeigen' : 'Musterlösung zeigen', 'data-tr-aufdecken', 'is-primary')}</div>`;
    } else {
      const text = String(k.text || '');
      const m = /\{\{([^{}\n]+)\}\}/.exec(text);
      const vor = m ? text.slice(0, m.index) : text;
      const nach = m ? text.slice(m.index + m[0].length) : '';
      const laenge = Math.max(6, String((k.quiz.loesungen && k.quiz.loesungen[0]) || '').length + 2);
      rumpf = `<h3 class="lw-trainer-frage lw-trainer-frage-luecke">${esc(vor)}<input class="lw-trainer-luecke" data-tr-luecke type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Lücke" size="${laenge}">${esc(nach)}</h3>
        <div class="lw-trainer-ergebnis" aria-live="polite"></div>
        <div class="lw-rating lw-trainer-fuss">${knopf('Prüfen', 'data-tr-pruefen', 'is-primary')}</div>`;
    }
    const image = k.quiz.image;
    const imageData = typeof image?.data === 'string' && image.data.length <= 12000 &&
      /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image.data) ? image.data : '';
    const picture = imageData ? `<figure class="lw-trainer-bild"><img src="${esc(imageData)}" alt="${esc(image.alt || 'Lernbild')}" style="display:block;max-width:100%;max-height:260px;object-fit:contain;margin:auto"></figure>` : '';
    ziel.innerHTML = `<section class="lw-trainer-runde" data-tr-id="${esc(k.id)}" data-tr-kind="${esc(kind)}">${kopf(k)}<article class="lw-study-card lw-trainer-karte">${picture}${rumpf}</article></section>`;
    zustand.gewaehlt = new Set(); zustand.geprueft = false; zustand.aufgedeckt = false;
    fuelle();
    const feld = ziel.querySelector<HTMLElement>('[data-tr-luecke], [data-tr-antwort]');
    if (feld) feld.focus();
    /* Zum KOPF der Lernwelt rollen, nicht zur Karte: die Karte allein oben
       liegt am Telefon unter dem Zurück-Pfeil der Schale (Bild, §55.1). */
    try { (ziel.closest<HTMLElement>('.lernwelt') || ziel).scrollIntoView({ block: 'start' }); } catch { /* alte Browser */ }
  };

  const fussSetzen = (html: string): void => {
    const fuss = zustand.ziel?.querySelector<HTMLElement>('.lw-trainer-fuss');
    if (fuss) fuss.innerHTML = html;
  };
  const ergebnisSetzen = (html: string): void => {
    const erg = zustand.ziel?.querySelector<HTMLElement>('.lw-trainer-ergebnis');
    if (erg) erg.innerHTML = html;
  };

  /** Der Weg zu Note und Speicher — eine Stelle. */
  const bewerten = (k: Karte, note: number): void => {
    const r = zustand.runde;
    if (!r) return;
    try { if (!r.name.startsWith('test:') && typeof WissenDienst !== 'undefined') WissenDienst.planen(k, note); } catch { /* nur lesbar oder ohne Dienst */ }
    if (note >= NOTE_RICHTIG) r.richtig++; else r.falsch++;
    const id = String(k.id);
    if (note < NOTE_RICHTIG && !r.name.startsWith('pruefung') && !r.name.startsWith('test:') && (r.nochmal[id] || 0) < NOCHMAL_HOECHSTENS) {
      r.nochmal[id] = (r.nochmal[id] || 0) + 1;
      r.reihenfolge.splice(Math.min(r.reihenfolge.length, r.index + 1 + NOCHMAL_NACH), 0, id);
    }
    r.index++;
    rundeMerken();
    zeige();
  };

  const pruefenMc = (k: Karte): void => {
    if (zustand.geprueft) return;
    zustand.geprueft = true;
    const optionen: Array<{ text: string; richtig: boolean }> = Array.isArray(k.quiz.optionen) ? k.quiz.optionen : [];
    const soll = new Set(optionen.map((o, i) => o.richtig ? i : -1).filter(i => i >= 0));
    const ist = zustand.gewaehlt;
    const richtig = soll.size === ist.size && [...soll].every(i => ist.has(i));
    zustand.ziel?.querySelectorAll<HTMLElement>('.lw-trainer-option').forEach(l => {
      const eingabe = l.querySelector<HTMLInputElement>('input');
      const i = Number(eingabe?.dataset['trOption']);
      let wort = '';
      if (soll.has(i) && ist.has(i)) { l.classList.add('is-richtig'); wort = 'richtig'; }
      else if (ist.has(i)) { l.classList.add('is-falsch'); wort = 'falsch'; }
      else if (soll.has(i)) { l.classList.add('is-fehlt'); wort = 'fehlt'; }
      if (eingabe) eingabe.disabled = true;
      if (wort) l.insertAdjacentHTML('beforeend', `<span class="lw-trainer-option-wort">${wort}</span>`);
    });
    ergebnisSetzen(`<p class="${richtig ? 'lw-trainer-gut' : 'lw-trainer-schlecht'}">${richtig ? 'Richtig.' : 'Nicht ganz — grün ist richtig, rot war falsch angekreuzt, gestrichelt hat gefehlt.'}</p>${k.quiz.hinweis ? `<p class="lw-trainer-hinweis">${esc(k.quiz.hinweis)}</p>` : ''}`);
    fussSetzen(knopf('Weiter', 'data-tr-weiter', 'is-primary'));
    zustand.ziel?.querySelector<HTMLElement>('[data-tr-weiter]')?.focus();
    zustand.ziel?.querySelector<HTMLElement>('.lw-trainer-fuss')?.setAttribute('data-tr-note', String(richtig ? NOTE_RICHTIG : NOTE_FALSCH));
  };

  const pruefenLuecke = (k: Karte): void => {
    if (zustand.geprueft) return;
    zustand.geprueft = true;
    const feld = zustand.ziel?.querySelector<HTMLInputElement>('[data-tr-luecke]');
    const loesungen: string[] = Array.isArray(k.quiz.loesungen) ? k.quiz.loesungen.map(String) : [];
    const eingabe = normal(feld?.value || '');
    const richtig = eingabe.length > 0 && loesungen.some(l => normal(l) === eingabe);
    if (feld) { feld.classList.add(richtig ? 'is-richtig' : 'is-falsch'); feld.disabled = true; }
    ergebnisSetzen(`<p class="${richtig ? 'lw-trainer-gut' : 'lw-trainer-schlecht'}">${richtig ? 'Richtig.' : 'Nicht richtig.'} Lösung: <b>${esc(loesungen[0] || '')}</b></p>`);
    fussSetzen(knopf('Weiter', 'data-tr-weiter', 'is-primary'));
    zustand.ziel?.querySelector<HTMLElement>('[data-tr-weiter]')?.focus();
    zustand.ziel?.querySelector<HTMLElement>('.lw-trainer-fuss')?.setAttribute('data-tr-note', String(richtig ? NOTE_RICHTIG : NOTE_FALSCH));
  };

  const aufdecken = (k: Karte): void => {
    if (zustand.aufgedeckt) return;
    zustand.aufgedeckt = true;
    const loesung: string[] = Array.isArray(k.quiz.musterloesung) ? k.quiz.musterloesung.map(String) : [];
    ergebnisSetzen(`<div class="lw-trainer-loesung"><div class="lw-trainer-loesung-kopf">Musterlösung</div>
      ${loesung.length > 1 ? `<ul>${loesung.map(z => `<li>${esc(z)}</li>`).join('')}</ul>` : `<p>${esc(loesung[0] || '')}</p>`}
      ${k.quiz.hinweis ? `<p class="lw-trainer-hinweis">${esc(k.quiz.hinweis)}</p>` : ''}</div>
      <p class="lw-trainer-anweisung">Hast du das gewusst?</p>`);
    fussSetzen([['1', 'Nochmal'], ['2', 'Schwer'], ['3', 'Gut'], ['4', 'Leicht']].map(([note, wort]) =>
      knopf(wort!, `data-tr-rate="${note}"`, note === '3' ? 'is-primary' : '')).join(''));
  };

  const ende = (): void => {
    const ziel = zustand.ziel;
    const r = zustand.runde;
    if (!ziel || !r) return;
    const gesamt = r.richtig + r.falsch;
    const name = r.name;
    zustand.runde = null;
    rundeMerken();
    ziel.innerHTML = `<section class="lw-trainer-ergebnis-seite"><div class="lw-training-result lw-trainer-ergebnis">${sym('party')}<p>Runde abgeschlossen</p>
      <h2><b>${r.richtig}</b> richtig · <b>${r.falsch}</b> falsch${gesamt ? ` · ${Math.round(r.richtig / gesamt * 100)} %` : ''}</h2>
      ${boxenZeile(karten())}
      <div class="lw-actions lw-trainer-reihe">${knopf('Zur Übersicht', 'data-tr-zurueck')}${knopf('Noch eine Runde', `data-tr-start="nochmal" data-name="${esc(name)}"`, 'is-primary')}</div></div></section>`;
    fuelle();
  };

  const beenden = (): void => {
    /* Die Runde bleibt gemerkt — Escape verliert nichts. */
    rundeMerken();
    zustand.runde = null;
    start();
  };

  /* ── Horcher ──────────────────────────────────────────────────────────── */
  const beiKlick = (e: Event): void => {
    const ziel = zustand.ziel;
    const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-tr-start], [data-tr-anlegen], [data-tr-pruefen], [data-tr-weiter], [data-tr-aufdecken], [data-tr-rate], [data-tr-ende], [data-tr-zurueck], [data-tr-option], [data-tr-match]');
    if (!ziel || !el || !ziel.contains(el)) return;
    if (el.hasAttribute('data-tr-match')) { e.preventDefault(); matchWahl(el.dataset.trMatch || '',Number(el.dataset.index)); return; }
    if (el.hasAttribute('data-tr-option')) {
      if (zustand.geprueft) { (el as HTMLInputElement).checked = zustand.gewaehlt.has(Number(el.dataset['trOption'])); return; }
      const i = Number(el.dataset['trOption']);
      if ((el as HTMLInputElement).type === 'radio') zustand.gewaehlt.clear();
      if ((el as HTMLInputElement).checked) zustand.gewaehlt.add(i); else zustand.gewaehlt.delete(i);
      return;
    }
    e.preventDefault();
    if (el.hasAttribute('data-tr-anlegen')) {
      const reg = (globalThis as any).Register;
      const id = el.getAttribute('data-tr-anlegen') || kapitelVorlagen().find(v => !v.angelegt)?.id || 'staatskunde-kapitel';
      try { reg?.vorlagen?.bauen?.(id); } catch { /* ohne Vorlage */ }
      start();
      return;
    }
    if (el.hasAttribute('data-tr-start')) {
      const art = el.dataset['trStart'];
      if (art === 'lernen') rundeStarten('lernen');
      else if (art === 'pruefung') rundeStarten(el.dataset['kapitel'] ? 'pruefung:' + el.dataset['kapitel'] : 'pruefung');
      else if (art === 'kapitel') rundeStarten('kapitel:' + (el.dataset['kapitel'] || ''));
      else if (art === 'test') rundeStarten('test:' + (el.dataset['kapitel'] || ''));
      else if (art === 'match') matchStart(el.dataset['kapitel'] || '');
      else if (art === 'thema') rundeStarten('thema:' + (el.dataset['thema'] || ''));
      else if (art === 'art') rundeStarten('art:' + (el.dataset['art'] || 'mc'));
      else if (art === 'nochmal') rundeStarten(el.dataset['name'] || 'lernen');
      return;
    }
    if (el.hasAttribute('data-tr-zurueck')) { start(); return; }
    if (el.hasAttribute('data-tr-ende')) { beenden(); return; }
    const k = aktuelleKarte();
    if (!k) { start(); return; }
    if (el.hasAttribute('data-tr-pruefen')) { if (k.quiz.kind === 'mc') pruefenMc(k); else pruefenLuecke(k); return; }
    if (el.hasAttribute('data-tr-aufdecken')) { aufdecken(k); return; }
    if (el.hasAttribute('data-tr-rate')) { if (zustand.aufgedeckt) bewerten(k, Number(el.dataset['trRate']) || NOTE_FALSCH); return; }
    if (el.hasAttribute('data-tr-weiter')) {
      const note = Number(ziel.querySelector<HTMLElement>('.lw-trainer-fuss')?.dataset['trNote']);
      bewerten(k, Number.isFinite(note) ? note : NOTE_FALSCH);
    }
  };

  const beiTaste = (e: KeyboardEvent): void => {
    const ziel = zustand.ziel;
    if (!ziel || !ziel.isConnected) { abmelden(); return; }
    if (matchRunde && e.key === 'Escape') {e.preventDefault();start();return;}
    if (!zustand.runde) return;
    const t = e.target as HTMLElement | null;
    const imText = t instanceof HTMLTextAreaElement;
    const imFeld = t instanceof HTMLInputElement && t.type !== 'checkbox';
    if (e.key === 'Escape') { e.preventDefault(); beenden(); return; }
    if (e.key === 'Enter' && !imText && !e.shiftKey) {
      const k = ziel.querySelector<HTMLElement>('[data-tr-weiter], [data-tr-pruefen], [data-tr-aufdecken]');
      if (k) { e.preventDefault(); k.click(); }
      return;
    }
    if (imText || imFeld) return;
    if (/^[1-4]$/.test(e.key)) {
      const k = ziel.querySelector<HTMLElement>(`[data-tr-rate="${e.key}"]`);
      if (k) { e.preventDefault(); k.click(); }
    }
  };

  let angemeldet = false;
  const abmelden = (): void => {
    if (!angemeldet) return;
    angemeldet = false;
    document.removeEventListener('keydown', beiTaste);
    zustand.ziel?.removeEventListener('click', beiKlick);
    zustand.ziel = null;
    zustand.runde = null;
    matchRunde = null;
  };

  /** In ein Element zeichnen — die Lernwelt gibt es her. */
  const render = (ziel: HTMLElement, opts: { aktor?: string } = {}): void => {
    abmelden();
    zustand.ziel = ziel;
    zustand.aktor = String(opts.aktor || 'ich');
    ziel.addEventListener('click', beiKlick);
    document.addEventListener('keydown', beiTaste);
    angemeldet = true;
    start();
  };

  return { render, abmelden, karten, boxVon, istFaellig, warteschlange, aufgabenVon, normal, kapitelVon, kapitelVorlagen,
           BOXEN, RUNDE_HOECHSTENS, NOCHMAL_NACH, NOCHMAL_HOECHSTENS, NOTE_RICHTIG, NOTE_FALSCH };
})();

(window as any).Trainer = Trainer;
