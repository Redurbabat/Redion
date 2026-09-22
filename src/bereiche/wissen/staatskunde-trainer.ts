/* ══ DER STAATSKUNDE-TRAINER (E677, vorläufiger Stand) ═══════════════════
   Redur, 21. September 2026: „ich brauche eine provisorische momentan …
   etwas das ich gut lernen kann". Das hier ist die Lernmaschine ohne die
   Anbindung ans Lernzentrum: sie hängt sich in irgendein Element
   (`mount`) und bekommt ihren Speicher von aussen (`Speicher`) — vorläufig
   der Browser-Speicher der Seite `lernen/staatskunde.html`, später das
   Meta-Fach von Redion. Der Inhalt kommt aus `staatskunde-inhalt.ts`.

   DIE LERNMETHODE: Boxen mit Abständen (Leitner).
     · Jede Aufgabe beginnt in Box 1. Richtig → eine Box höher (bis 5),
       falsch → zurück in Box 1.
     · Box n wird nach ABSTAND_TAGE[n-1] Tagen wieder fällig: heute,
       morgen, 3 Tage, 1 Woche, 2 Wochen. Was sitzt, kommt selten.
     · In einer Runde kommt eine falsch beantwortete Aufgabe nach drei
       anderen NOCH EINMAL — bis zu zweimal. Was man nicht weiss, sieht
       man mehrmals, bevor die Runde zu Ende ist.
     · Fällige Aufgaben zuerst, niedrige Boxen zuerst; sind zu wenige
       fällig, füllen die schwächsten Karten die Runde auf.

   DREI AUFGABENFORMEN: Multiple Choice (mehrere Antworten können richtig
   sein — wie in der Prüfung), Schreiben (eigene Antwort, dann die
   Musterlösung und die Selbsteinschätzung), Lücke (getippt, nachsichtig
   verglichen). Die Prüfungsfragen des Lehrers stehen 1:1 da.

   Alles, was aus dem Inhalt in HTML geht, läuft durch `esc` (§19). */

/* Die Typen kommen aus dem Inhalt selbst — `staatskunde-inhalt.ts` steht
   im selben Programm, also kennt der Trainer die Form der Aufgaben, ohne
   sie ein zweites Mal hinzuschreiben (§8). */
type TrainerAufgabe = typeof StaatskundeInhalt.AUFGABEN[number];
type TrainerMc = Extract<TrainerAufgabe, { art: 'mc' }>;
type TrainerSchreiben = Extract<TrainerAufgabe, { art: 'schreiben' }>;
type TrainerLuecke = Extract<TrainerAufgabe, { art: 'luecke' }>;

type Stand = { box: number; richtig: number; falsch: number; faellig: string; zuletzt: string };
type Fortschritt = { karten: Record<string, Stand>; runden: number };
type Speicher = { lesen(): Fortschritt | null; schreiben(f: Fortschritt): void };

const StaatskundeTrainer = (() => {
  const BOXEN = 5;
  const ABSTAND_TAGE = [0, 1, 3, 7, 14];
  const RUNDE_HOECHSTENS = 20;
  const NOCHMAL_NACH = 3;          /* eine falsche Aufgabe kommt nach so vielen anderen wieder */
  const NOCHMAL_HOECHSTENS = 2;
  const SPEICHER_SCHLUESSEL = 'staatskunde-trainer';

  const esc = (wert: unknown): string => String(wert ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* Der Tag als `JJJJ-MM-TT` in der Ortszeit — Vergleich als Zeichenkette reicht. */
  const tagVon = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const heute = (): string => tagVon(new Date());
  const tagPlus = (tage: number): string => { const d = new Date(); d.setDate(d.getDate() + tage); return tagVon(d); };

  /* Vorläufig: der Speicher der Seite selbst. Redion bringt später das Meta-Fach. */
  const lokalerSpeicher: Speicher = {
    lesen: () => {
      try { const roh = localStorage.getItem(SPEICHER_SCHLUESSEL); return roh ? JSON.parse(roh) as Fortschritt : null; }
      catch { return null; }
    },
    schreiben: f => { try { localStorage.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(f)); } catch { /* voll oder gesperrt */ } }
  };

  const leer = (): Fortschritt => ({ karten: {}, runden: 0 });
  const standVon = (f: Fortschritt, id: string): Stand =>
    f.karten[id] ?? { box: 1, richtig: 0, falsch: 0, faellig: heute(), zuletzt: '' };
  const istFaellig = (f: Fortschritt, id: string): boolean => standVon(f, id).faellig <= heute();

  /* Nachsichtiger Vergleich für die Lücke: Gross/klein, Umlaute, Satzzeichen, Leerraum. */
  const normal = (s: string): string => String(s || '').toLowerCase()
    .replace(/ß/g, 'ss').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
    .replace(/[^a-z0-9]+/g, ' ').trim();

  const mischen = <T,>(a: T[]): T[] => {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j]!, b[i]!]; }
    return b;
  };

  /** Die Runde: fällige zuerst (schwächste Box vorn), dann die schwächsten nicht fälligen. */
  const warteschlange = (f: Fortschritt, aufgaben: TrainerAufgabe[], hoechstens = RUNDE_HOECHSTENS): TrainerAufgabe[] => {
    const nachBox = (a: TrainerAufgabe): number => standVon(f, a.id).box;
    const faellig = mischen(aufgaben.filter(a => istFaellig(f, a.id))).sort((a, b) => nachBox(a) - nachBox(b));
    const rest = mischen(aufgaben.filter(a => !istFaellig(f, a.id))).sort((a, b) => nachBox(a) - nachBox(b));
    return faellig.concat(rest).slice(0, hoechstens);
  };

  const bewerten = (f: Fortschritt, speicher: Speicher, a: TrainerAufgabe, richtig: boolean): void => {
    const s = standVon(f, a.id);
    const box = richtig ? Math.min(BOXEN, s.box + 1) : 1;
    f.karten[a.id] = { box, richtig: s.richtig + (richtig ? 1 : 0), falsch: s.falsch + (richtig ? 0 : 1),
      faellig: tagPlus(ABSTAND_TAGE[box - 1] ?? 0), zuletzt: new Date().toISOString() };
    speicher.schreiben(f);
  };

  const themaName = (id: string): string => StaatskundeInhalt.THEMEN.find(t => t.id === id)?.name ?? id;
  const artName = (a: TrainerAufgabe): string =>
    a.art === 'mc' ? 'Multiple Choice' : a.art === 'schreiben' ? 'Schreiben' : 'Lücke';

  /* ── Aufbau ─────────────────────────────────────────────────────────────── */
  const mount = (wurzel: HTMLElement, speicher: Speicher = lokalerSpeicher): { start: () => void } => {
    let f: Fortschritt = speicher.lesen() ?? leer();
    if (!f.karten || typeof f.karten !== 'object') f = leer();
    const alle = StaatskundeInhalt.AUFGABEN;

    const knopf = (text: string, klasse = '', attr = ''): string =>
      `<button type="button" class="sk-knopf ${klasse}" ${attr}>${esc(text)}</button>`;

    const boxenZeile = (aufgaben: TrainerAufgabe[]): string => {
      const zaehler = Array.from({ length: BOXEN }, () => 0);
      aufgaben.forEach(a => { zaehler[standVon(f, a.id).box - 1]!++; });
      return `<div class="sk-boxen" aria-label="Boxen">${zaehler.map((n, i) =>
        `<div class="sk-box sk-box-${i + 1}"><div class="sk-box-zahl">${n}</div><div class="sk-box-name">Box ${i + 1}</div><div class="sk-box-tage">${i === 0 ? 'heute' : i === 1 ? 'morgen' : ABSTAND_TAGE[i] + ' Tage'}</div></div>`).join('')}</div>`;
    };

    const start = (): void => {
      const faellig = alle.filter(a => istFaellig(f, a.id)).length;
      const pruefung = alle.filter(a => a.art === 'mc' && a.pruefung || a.art === 'schreiben');
      wurzel.innerHTML = `
        <section class="sk-start">
          <h1 class="sk-titel">Staatskunde — Leben in der Schweiz</h1>
          <p class="sk-unter">Lehrmittel «Allgemeinbildung, Ausgabe Basel», Seiten 155–160 · ${alle.length} Aufgaben · ${f.runden} Runden gelernt</p>
          ${boxenZeile(alle)}
          <p class="sk-faellig">${faellig === 0 ? 'Heute ist nichts fällig — alles sitzt. Wer will, übt trotzdem.' : `<b>${faellig}</b> Aufgaben sind heute fällig.`}</p>
          <div class="sk-reihe">
            ${knopf(faellig ? 'Lernen — fällige zuerst' : 'Lernen', 'sk-haupt', 'data-a="lernen"')}
            ${knopf('Prüfung üben — die 7 + 13 Fragen', '', 'data-a="pruefung"')}
          </div>
          <h2 class="sk-h2">Nach Thema</h2>
          <div class="sk-reihe sk-themen">
            ${StaatskundeInhalt.THEMEN.map(t => {
              const zu = alle.filter(a => a.thema === t.id);
              const sitzt = zu.filter(a => standVon(f, a.id).box >= 4).length;
              return knopf(`${t.name} · ${sitzt}/${zu.length} sitzen`, 'sk-thema', `data-a="thema" data-thema="${esc(t.id)}"`);
            }).join('')}
          </div>
          <h2 class="sk-h2">Nach Aufgabenform</h2>
          <div class="sk-reihe">
            ${knopf('Nur Multiple Choice', '', 'data-a="art" data-art="mc"')}
            ${knopf('Nur Schreiben', '', 'data-a="art" data-art="schreiben"')}
            ${knopf('Nur Lücken', '', 'data-a="art" data-art="luecke"')}
          </div>
          <p class="sk-klein">Tasten: 1–4 wählen · Enter prüfen und weiter · J gewusst · N nicht gewusst</p>
          <p class="sk-klein">${knopf('Fortschritt zurücksetzen', 'sk-leise', 'data-a="reset"')} · ${pruefung.length} Prüfungsfragen</p>
        </section>`;
    };

    /* ── Die Runde ─────────────────────────────────────────────────────────── */
    const runde = (aufgaben: TrainerAufgabe[], name: string): void => {
      const schlange = aufgaben.slice();
      const nochmal: Record<string, number> = {};
      let i = 0, richtigZahl = 0, falschZahl = 0;
      let gewaehlt = new Set<number>();
      let geprueft = false;

      const ende = (): void => {
        f.runden += 1; speicher.schreiben(f);
        const gesamt = richtigZahl + falschZahl;
        wurzel.innerHTML = `
          <section class="sk-ende">
            <h1 class="sk-titel">Runde fertig</h1>
            <p class="sk-gross"><b>${richtigZahl}</b> richtig · <b>${falschZahl}</b> falsch${gesamt ? ` · ${Math.round(richtigZahl / gesamt * 100)} %` : ''}</p>
            ${boxenZeile(alle)}
            <div class="sk-reihe">${knopf('Noch eine Runde', 'sk-haupt', 'data-a="nochmal"')}${knopf('Zum Start', '', 'data-a="start"')}</div>
          </section>`;
        wurzel.querySelector('[data-a="nochmal"]')?.addEventListener('click', () => runde(warteschlange(f, aufgabenVon(name)), name));
        wurzel.querySelector('[data-a="start"]')?.addEventListener('click', start);
      };

      const kopf = (a: TrainerAufgabe): string => {
        const s = standVon(f, a.id);
        return `<div class="sk-kopf">
          <span class="sk-zaehler">${i + 1} / ${schlange.length}</span>
          <span class="sk-tag">${esc(themaName(a.thema))}</span>
          <span class="sk-tag">${esc(artName(a))}</span>
          <span class="sk-tag sk-tag-box">Box ${s.box}</span>
          <span class="sk-quelle">${esc(a.quelle)}</span>
        </div>`;
      };

      const weiter = (a: TrainerAufgabe, richtig: boolean): void => {
        bewerten(f, speicher, a, richtig);
        if (richtig) richtigZahl++; else falschZahl++;
        /* Was man nicht wusste, kommt nach drei anderen noch einmal — höchstens zweimal. */
        if (!richtig && name !== 'pruefung' && (nochmal[a.id] ?? 0) < NOCHMAL_HOECHSTENS) {
          nochmal[a.id] = (nochmal[a.id] ?? 0) + 1;
          schlange.splice(Math.min(schlange.length, i + 1 + NOCHMAL_NACH), 0, a);
        }
        i++; gewaehlt = new Set(); geprueft = false;
        zeige();
      };

      const zeige = (): void => {
        const a = schlange[i];
        if (!a) { ende(); return; }
        if (a.art === 'mc') zeigeMc(a);
        else if (a.art === 'schreiben') zeigeSchreiben(a);
        else zeigeLuecke(a);
        wurzel.querySelector<HTMLElement>('.sk-karte')?.scrollIntoView({ block: 'start' });
      };

      const zeigeMc = (a: TrainerMc): void => {
        wurzel.innerHTML = `
          <section class="sk-karte" data-id="${esc(a.id)}">
            ${kopf(a)}
            <h2 class="sk-frage">${esc(a.frage)}</h2>
            <p class="sk-anweisung">Kreuzen Sie die richtige(n) Antwort(en) an.</p>
            <div class="sk-antworten">${a.antworten.map((t, k) =>
              `<button type="button" class="sk-antwort" data-k="${k}" aria-pressed="false"><span class="sk-kasten" aria-hidden="true"></span><span class="sk-buchstabe">${'abcd'[k] ?? ''})</span> ${esc(t)}</button>`).join('')}</div>
            <div class="sk-ergebnis" aria-live="polite"></div>
            <div class="sk-reihe sk-fuss">${knopf('Prüfen', 'sk-haupt', 'data-a="pruefen"')}${knopf('Abbrechen', 'sk-leise', 'data-a="start"')}</div>
          </section>`;
        wurzel.querySelectorAll<HTMLButtonElement>('.sk-antwort').forEach(b => b.addEventListener('click', () => {
          if (geprueft) return;
          const k = Number(b.dataset['k']);
          if (gewaehlt.has(k)) gewaehlt.delete(k); else gewaehlt.add(k);
          b.setAttribute('aria-pressed', gewaehlt.has(k) ? 'true' : 'false');
        }));
        wurzel.querySelector('[data-a="start"]')?.addEventListener('click', start);
        const pruefen = (): void => {
          if (geprueft) return;
          geprueft = true;
          const soll = new Set(a.richtig);
          const richtig = soll.size === gewaehlt.size && [...soll].every(k => gewaehlt.has(k));
          wurzel.querySelectorAll<HTMLButtonElement>('.sk-antwort').forEach(b => {
            const k = Number(b.dataset['k']);
            if (soll.has(k) && gewaehlt.has(k)) b.classList.add('sk-richtig');
            else if (gewaehlt.has(k)) b.classList.add('sk-falsch');
            else if (soll.has(k)) b.classList.add('sk-fehlt');
            b.disabled = true;
          });
          const erg = wurzel.querySelector<HTMLElement>('.sk-ergebnis');
          if (erg) erg.innerHTML = `<p class="${richtig ? 'sk-gut' : 'sk-schlecht'}">${richtig ? 'Richtig.' : 'Nicht ganz — grün ist richtig, rot war falsch angekreuzt, umrandet hat gefehlt.'}</p>`;
          const fuss = wurzel.querySelector<HTMLElement>('.sk-fuss');
          if (fuss) { fuss.innerHTML = knopf('Weiter', 'sk-haupt', 'data-a="weiter"'); fuss.querySelector('[data-a="weiter"]')?.addEventListener('click', () => weiter(a, richtig)); (fuss.querySelector('[data-a="weiter"]') as HTMLElement | null)?.focus(); }
        };
        wurzel.querySelector('[data-a="pruefen"]')?.addEventListener('click', pruefen);
      };

      const zeigeSchreiben = (a: TrainerSchreiben): void => {
        wurzel.innerHTML = `
          <section class="sk-karte" data-id="${esc(a.id)}">
            ${kopf(a)}
            <h2 class="sk-frage">${a.nummer ? `<span class="sk-nummer">${esc(a.nummer)}</span> ` : ''}${esc(a.frage)}</h2>
            <textarea class="sk-feld" rows="4" placeholder="Antwort in eigenen Worten …" aria-label="Antwort"></textarea>
            <div class="sk-ergebnis" aria-live="polite"></div>
            <div class="sk-reihe sk-fuss">${knopf('Lösung zeigen', 'sk-haupt', 'data-a="loesung"')}${knopf('Abbrechen', 'sk-leise', 'data-a="start"')}</div>
          </section>`;
        wurzel.querySelector('[data-a="start"]')?.addEventListener('click', start);
        wurzel.querySelector<HTMLTextAreaElement>('.sk-feld')?.focus();
        const loesung = (): void => {
          if (geprueft) return;
          geprueft = true;
          const erg = wurzel.querySelector<HTMLElement>('.sk-ergebnis');
          if (erg) erg.innerHTML = `<div class="sk-loesung"><div class="sk-loesung-kopf">Musterlösung</div>
            ${a.loesung.length > 1 ? `<ul>${a.loesung.map(z => `<li>${esc(z)}</li>`).join('')}</ul>` : `<p>${esc(a.loesung[0])}</p>`}
            ${a.hinweis ? `<p class="sk-hinweis">${esc(a.hinweis)}</p>` : ''}</div>
            <p class="sk-anweisung">Hast du das gewusst?</p>`;
          const fuss = wurzel.querySelector<HTMLElement>('.sk-fuss');
          if (fuss) {
            fuss.innerHTML = knopf('Gewusst ✓', 'sk-haupt sk-ja', 'data-a="ja"') + knopf('Nicht gewusst ✗', 'sk-nein', 'data-a="nein"');
            fuss.querySelector('[data-a="ja"]')?.addEventListener('click', () => weiter(a, true));
            fuss.querySelector('[data-a="nein"]')?.addEventListener('click', () => weiter(a, false));
          }
        };
        wurzel.querySelector('[data-a="loesung"]')?.addEventListener('click', loesung);
      };

      const zeigeLuecke = (a: TrainerLuecke): void => {
        const teile = a.frage.split('___');
        wurzel.innerHTML = `
          <section class="sk-karte" data-id="${esc(a.id)}">
            ${kopf(a)}
            <h2 class="sk-frage sk-frage-luecke">${esc(teile[0] ?? '')}<input class="sk-luecke" type="text" autocomplete="off" autocapitalize="off" aria-label="Lücke" size="${Math.max(6, (a.loesung[0] ?? '').length + 2)}">${esc(teile.slice(1).join('___'))}</h2>
            <div class="sk-ergebnis" aria-live="polite"></div>
            <div class="sk-reihe sk-fuss">${knopf('Prüfen', 'sk-haupt', 'data-a="pruefen"')}${knopf('Abbrechen', 'sk-leise', 'data-a="start"')}</div>
          </section>`;
        wurzel.querySelector('[data-a="start"]')?.addEventListener('click', start);
        const feld = wurzel.querySelector<HTMLInputElement>('.sk-luecke');
        feld?.focus();
        const pruefen = (): void => {
          if (geprueft) return;
          geprueft = true;
          const eingabe = normal(feld?.value ?? '');
          const richtig = eingabe.length > 0 && a.loesung.some(l => normal(l) === eingabe);
          feld?.classList.add(richtig ? 'sk-richtig' : 'sk-falsch');
          if (feld) feld.disabled = true;
          const erg = wurzel.querySelector<HTMLElement>('.sk-ergebnis');
          if (erg) erg.innerHTML = `<p class="${richtig ? 'sk-gut' : 'sk-schlecht'}">${richtig ? 'Richtig.' : 'Nicht richtig.'} Lösung: <b>${esc(a.loesung[0])}</b></p>`;
          const fuss = wurzel.querySelector<HTMLElement>('.sk-fuss');
          if (fuss) { fuss.innerHTML = knopf('Weiter', 'sk-haupt', 'data-a="weiter"'); fuss.querySelector('[data-a="weiter"]')?.addEventListener('click', () => weiter(a, richtig)); (fuss.querySelector('[data-a="weiter"]') as HTMLElement | null)?.focus(); }
        };
        wurzel.querySelector('[data-a="pruefen"]')?.addEventListener('click', pruefen);
      };

      zeige();
    };

    const aufgabenVon = (name: string): TrainerAufgabe[] => {
      if (name === 'pruefung') return alle.filter(a => (a.art === 'mc' && a.pruefung) || a.art === 'schreiben');
      if (name.startsWith('thema:')) return alle.filter(a => a.thema === name.slice(6));
      if (name.startsWith('art:')) return alle.filter(a => a.art === name.slice(4));
      return alle;
    };

    /* Tasten: 1–4 wählen, Enter prüft oder geht weiter, J/N bewerten die Schreibaufgabe. */
    wurzel.addEventListener('keydown', e => {
      const ziel = e.target as HTMLElement | null;
      const imText = ziel instanceof HTMLTextAreaElement;
      if (e.key === 'Enter' && !imText && !e.shiftKey) {
        const k = wurzel.querySelector<HTMLButtonElement>('[data-a="weiter"], [data-a="pruefen"], [data-a="loesung"]');
        if (k) { e.preventDefault(); k.click(); }
        return;
      }
      if (ziel instanceof HTMLInputElement || imText) return;
      if (/^[1-4]$/.test(e.key)) wurzel.querySelector<HTMLButtonElement>(`.sk-antwort[data-k="${Number(e.key) - 1}"]`)?.click();
      if (e.key === 'j' || e.key === 'J') wurzel.querySelector<HTMLButtonElement>('[data-a="ja"]')?.click();
      if (e.key === 'n' || e.key === 'N') wurzel.querySelector<HTMLButtonElement>('[data-a="nein"]')?.click();
    });
    wurzel.addEventListener('click', e => {
      const k = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-a]');
      if (!k) return;
      const a = k.dataset['a'];
      if (a === 'lernen') runde(warteschlange(f, alle), 'lernen');
      else if (a === 'pruefung') runde(aufgabenVon('pruefung'), 'pruefung');
      else if (a === 'thema') runde(warteschlange(f, aufgabenVon('thema:' + k.dataset['thema'])), 'thema:' + k.dataset['thema']);
      else if (a === 'art') runde(warteschlange(f, aufgabenVon('art:' + k.dataset['art'])), 'art:' + k.dataset['art']);
      else if (a === 'reset') { if (confirm('Allen Fortschritt löschen? Alle Aufgaben stehen danach wieder in Box 1.')) { f = leer(); speicher.schreiben(f); start(); } }
    });

    start();
    return { start };
  };

  return { mount, warteschlange, bewerten, normal, leer, standVon, istFaellig, BOXEN, ABSTAND_TAGE, RUNDE_HOECHSTENS, NOCHMAL_NACH, NOCHMAL_HOECHSTENS, lokalerSpeicher };
})();

(window as any).StaatskundeTrainer = StaatskundeTrainer;
