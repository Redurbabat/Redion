/* ============================================================================
 * schale/bedienung/zustandsknopf.ts — der Knopf, der zeigt, was er tut
 * ----------------------------------------------------------------------------
 * ERZEUGT DARAUS WIRD `quell/schale/bedienung/zustandsknopf.js`.
 * Die Quelle ist DIESE Datei. `npm run bauen:ts` schreibt das .js; wer das
 * .js bearbeitet, verliert die Änderung beim nächsten Bauen (test105).
 * ----------------------------------------------------------------------------
 * WOFÜR. Eine Sicherung mit Anhängen dauert Sekunden bis Minuten, eine
 * KI-Antwort auch, ein Export ebenso. Bis hierher zeigte in dieser Zeit
 * meistens NICHTS an, dass etwas läuft — und wer nichts sieht, tippt ein
 * zweites Mal. Der Start-Bildschirm hatte dafür eine eigene Lösung (E57,
 * `.hs-kreisel`); jede weitere Stelle hätte sich wieder eine gebaut.
 *
 * Dieser Knopf ist die EINE Lösung: er löst die Aktion aus, sperrt sich,
 * solange sie läuft, sagt sichtbar UND hörbar, was gerade ist, und kehrt
 * danach zurück — oder bietet „Öffnen" an, wenn es etwas zu öffnen gibt.
 *
 * VIER ZUSTÄNDE, und sie kommen aus dem ECHTEN Ablauf:
 *
 *     bereit    → Klick startet `aktion()`
 *     arbeitet  → die Zusage aus `aktion()` ist noch offen; Klick tut nichts
 *     fertig    → die Zusage ist eingelöst; nach `fertigNach` ms zurück auf
 *                 bereit — oder, mit `oeffnen`, die Aufforderung „Öffnen"
 *     fehler    → die Zusage ist geplatzt (oder `aktion()` gab `false`);
 *                 Klick versucht es noch einmal
 *
 * Kein Zeitgeber täuscht ein „fertig" vor. Was der Knopf zeigt, ist der
 * Stand der Zusage — nichts anderes.
 *
 * DIE SICHTEN. `art` sagt, wie der Verlauf aussieht, nicht was er ist:
 * 'weiter' (Standard) ist ein gewöhnlicher Aktionsknopf, 'laden' die
 * Sicht „Herunterladen → Balken → Heruntergeladen → Öffnen" (Auftrag
 * §4.16). 'erzeugen' und 'schaltung' sind vorgesehen (`data-art`) und
 * bekommen ihre Sicht in den Phasen D und E.
 *
 * WAS ER VON `zustand.ts` NIMMT. Zeichen und Standardsätze. Der Knopf
 * erfindet keine zweite Sprache für „läuft" — Pille und Knopf sagen es
 * mit demselben Zeichen.
 * ==========================================================================*/

type ZustandsknopfZustand = 'bereit' | 'arbeitet' | 'fertig' | 'fehler';

interface ZustandsknopfTexte {
  /** Was auf dem Knopf steht, solange nichts läuft. */
  bereit: string;
  /** … während die Aktion läuft. Deutsch und konkret: „Wird erstellt …". */
  arbeitet: string;
  /** … nach Erfolg. Mit `oeffnen` ist das die Aufforderung („Öffnen"). */
  fertig?: string;
  /** … nach Fehlschlag. Ohne ihn steht die Meldung des Fehlers, gekürzt. */
  fehler?: string;
  /** Nur mit `oeffnen`: die Bestätigung („Heruntergeladen"), die kurz vor
      der Aufforderung steht. Ohne sie kommt die Aufforderung sofort. */
  geschafft?: string;
}

interface ZustandsknopfAuftrag {
  texte: ZustandsknopfTexte;
  /** Sicht: 'weiter' | 'laden' | 'erzeugen' | 'schaltung' → `data-art`. */
  art?: string;
  /** Zusätzliche Klassen, z. B. 'btn prim' oder 'ez-knopf'. */
  klasse?: string;
  /** Ein Zeichen aus `Register.symbole` für den Zustand bereit. */
  zeichen?: string;
  /** Läuft bei Klick in bereit, fertig (ohne `oeffnen`) und fehler.
      Ein ausdrückliches `false` zählt als Fehlschlag — so hält es
      `App.sicherungSpeichern`, das seine Fehler selbst fängt. */
  aktion: () => Promise<unknown> | unknown;
  /** ms, bis 'fertig' zurück auf 'bereit' fällt. Standard 2500; 0 = bleibt.
      Mit `oeffnen` ist der Standard 0 — eine Aufforderung, die nach zwei
      Sekunden verschwindet, ist keine. */
  fertigNach?: number;
  /** Wenn gesetzt: nach 'fertig' zeigt der Knopf `texte.fertig` als
      Aufforderung, und ein Klick ruft `oeffnen()` statt `aktion()`. Danach
      steht der Knopf wieder auf bereit. */
  oeffnen?: () => void;
}

interface ZustandsknopfGriff {
  element: HTMLButtonElement;
  zustand: () => ZustandsknopfZustand;
  /** Von aussen treiben — etwa mit Fortschrittstext. `anteil` (0…1) macht
      den Balken der Sicht 'laden' bestimmt; ohne ihn läuft er unbestimmt. */
  setzen: (art: ZustandsknopfZustand, text?: string, anteil?: number) => void;
}

const Zustandsknopf = (() => {

  /* Das Zeichen der Sicht 'laden' im Zustand bereit: ein Pfeil nach
     unten. Alles andere kommt aus `Zustand`, damit Knopf und Pille
     dieselbe Sprache sprechen. */
  const ZEICHEN_LADEN = '↓';
  const ZEICHEN_OEFFNEN = '↗';

  const kurz = (fehler: unknown): string => {
    const m = fehler instanceof Error ? fehler.message : String(fehler ?? '');
    const eine = m.split('\n')[0]?.trim() ?? '';
    if (!eine) return Zustand.text('fehler');
    return eine.length > 60 ? eine.slice(0, 57) + ' …' : eine;
  };

  const bauen = (auftrag: ZustandsknopfAuftrag): ZustandsknopfGriff => {
    const art = auftrag.art || 'weiter';
    const fertigNach = auftrag.fertigNach ?? (auftrag.oeffnen ? 0 : 2500);

    const knopf = document.createElement('button');
    knopf.type = 'button';
    knopf.className = 'ru-zk' + (auftrag.klasse ? ' ' + auftrag.klasse : '');
    knopf.dataset['art'] = art;

    const zeichen = document.createElement('span');
    zeichen.className = 'ru-zk-zeichen';
    zeichen.setAttribute('aria-hidden', 'true');

    /* DER TEXT IST DIE LIVE-REGION. Ein Vorleseprogramm hört „Wird
       erstellt …" und später „Heruntergeladen" — ohne dass der Nutzer den
       Knopf noch einmal anfassen muss. `polite`, nicht `assertive`: der
       Wechsel darf warten, bis der Satz zu Ende ist. */
    const text = document.createElement('span');
    text.className = 'ru-zk-text';
    text.setAttribute('aria-live', 'polite');

    /* Der Balken gehört der Sicht 'laden' und ist Schmuck: die Auskunft
       steht im Text. Deshalb `aria-hidden`. */
    const balken = document.createElement('span');
    balken.className = 'ru-zk-balken';
    balken.setAttribute('aria-hidden', 'true');
    balken.append(document.createElement('i'));

    knopf.append(zeichen, text, balken);

    let jetzt: ZustandsknopfZustand = 'bereit';
    let aufforderung = false;          /* fertig + oeffnen: „Öffnen" steht da */
    let zeitgeber: ReturnType<typeof setTimeout> | null = null;

    const bereitZeichen = (): string => {
      if (art === 'laden') return ZEICHEN_LADEN;
      if (auftrag.zeichen && typeof Register !== 'undefined' && Register.symbole?.hat?.(auftrag.zeichen))
        return Register.symbole.alsSvg(auftrag.zeichen, 16);
      return '';
    };

    const stellen = (z: ZustandsknopfZustand, satz: string, anteil?: number): void => {
      if (zeitgeber) { clearTimeout(zeitgeber); zeitgeber = null; }
      jetzt = z;
      knopf.dataset['zustand'] = z;
      knopf.setAttribute('aria-busy', z === 'arbeitet' ? 'true' : 'false');
      knopf.classList.toggle('ru-zk-aufforderung', aufforderung);

      if (z === 'bereit') {
        /* Das Zeichen von bereit kann ein SVG sein — das ist Redions
           eigenes Strichzeichen, kein Nutzertext. */
        zeichen.innerHTML = bereitZeichen();
      } else if (aufforderung) {
        zeichen.textContent = ZEICHEN_OEFFNEN;
      } else {
        zeichen.textContent = Zustand.zeichen(
          z === 'arbeitet' ? 'laeuft' : z === 'fertig' ? 'fertig' : 'fehler');
      }
      zeichen.hidden = zeichen.innerHTML === '';
      text.textContent = satz;

      /* Der Balken: bestimmt, wenn ein Anteil bekannt ist; sonst läuft er
         unbestimmt hin und her. Nie ein erfundener Prozentwert. */
      if (typeof anteil === 'number' && Number.isFinite(anteil)) {
        const a = Math.max(0, Math.min(1, anteil));
        balken.classList.add('bestimmt');
        balken.style.setProperty('--ru-zk-anteil', (a * 100).toFixed(1) + '%');
      } else {
        balken.classList.remove('bestimmt');
        balken.style.removeProperty('--ru-zk-anteil');
      }
    };

    const bereit = (): void => { aufforderung = false; stellen('bereit', auftrag.texte.bereit); };

    const fertig = (): void => {
      if (auftrag.oeffnen) {
        /* Erst die Bestätigung, dann die Aufforderung — wenn es eine
           Bestätigung gibt. Der Zustand ist in beiden Fällen 'fertig';
           der Zeitgeber wechselt nur den Satz, nicht die Wahrheit. */
        const zurAufforderung = (): void => {
          aufforderung = true;
          stellen('fertig', auftrag.texte.fertig ?? 'Öffnen');
        };
        if (auftrag.texte.geschafft) {
          aufforderung = false;
          stellen('fertig', auftrag.texte.geschafft);
          zeitgeber = setTimeout(zurAufforderung, 1200);
        } else zurAufforderung();
        return;
      }
      aufforderung = false;
      stellen('fertig', auftrag.texte.fertig ?? Zustand.text('fertig'));
      if (fertigNach > 0) zeitgeber = setTimeout(bereit, fertigNach);
    };

    const starten = (): void => {
      aufforderung = false;
      stellen('arbeitet', auftrag.texte.arbeitet);
      let zusage: Promise<unknown>;
      try { zusage = Promise.resolve(auftrag.aktion()); }
      catch (fehler) { zusage = Promise.reject(fehler); }
      zusage.then(
        ergebnis => {
          if (jetzt !== 'arbeitet') return;      /* von aussen umgestellt */
          if (ergebnis === false) stellen('fehler', auftrag.texte.fehler ?? Zustand.text('fehler'));
          else fertig();
        },
        fehler => {
          if (jetzt !== 'arbeitet') return;
          stellen('fehler', auftrag.texte.fehler ?? kurz(fehler));
        });
    };

    knopf.addEventListener('click', () => {
      /* DIE SPERRE (Auftrag §4.9). Ein zweiter Klick während der Arbeit
         wäre eine zweite Sicherung, eine zweite KI-Anfrage, ein zweiter
         Druckauftrag. Der Knopf ist dabei NICHT `disabled` — er behält
         den Fokus und bleibt lesbar; er tut nur nichts. */
      if (jetzt === 'arbeitet') return;
      if (jetzt === 'fertig' && aufforderung && auftrag.oeffnen) {
        auftrag.oeffnen();
        bereit();
        return;
      }
      starten();
    });

    bereit();

    return {
      element: knopf,
      zustand: () => jetzt,
      setzen: (z: ZustandsknopfZustand, satz?: string, anteil?: number) => {
        if (z === 'bereit') { bereit(); return; }
        if (z === 'fertig' && satz === undefined) { fertig(); return; }
        aufforderung = false;
        const standard = z === 'arbeitet' ? auftrag.texte.arbeitet
          : z === 'fertig' ? (auftrag.texte.fertig ?? Zustand.text('fertig'))
          : (auftrag.texte.fehler ?? Zustand.text('fehler'));
        stellen(z, satz ?? standard, anteil);
      }
    };
  };

  return { bauen };
})();

(window as any).Zustandsknopf = Zustandsknopf;
