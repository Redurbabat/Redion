/* ============================================================================
 * bereiche/wissen/produkt_onboarding.ts — Einstieg in zwei Redion-Welten
 * ----------------------------------------------------------------------------
 * Dieses Onboarding ordnet keine Seite um und kopiert keinen Inhalt. Es merkt
 * nur die bevorzugte Hauptwelt und ausgewählte Lebensbereiche. Fehlende
 * Bereichsdefinitionen werden erst beim ausdrücklichen Abschluss über den
 * vorhandenen `Lebensbereiche`-Kern angelegt.
 * ==========================================================================*/

const ProduktOnboarding = (() => {
  type Hauptwelt = 'beide' | 'lernen' | 'workspace';
  type Status = 'neu' | 'fertig' | 'uebersprungen';

  type Profil = {
    version: 1;
    status: Status;
    welt: Hauptwelt;
    auswahl: string[];
    bereichIds: string[];
    updatedAt: string;
  };

  type Ergebnis = {
    status: 'fertig' | 'uebersprungen';
    welt: Hauptwelt;
    bereichIds: string[];
  };

  type BereichVorgabe = {
    key: string;
    name: string;
    icon: string;
    art: 'ausbildung' | 'uni' | 'arbeit' | 'privat';
    beschreibung: string;
  };

  const META_KEY = 'produktOnboarding:v1';
  const STIL_ID = 'produkt-onboarding-stil';
  const BEREICHE: BereichVorgabe[] = [
    {
      key: 'elektro', name: 'Elektro-Ausbildung', icon: '⚡', art: 'ausbildung',
      beschreibung: 'Lernstoff, Berichtsheft, Prüfungen und Fachpraxis zusammen ansehen.'
    },
    {
      key: 'uni', name: 'Uni', icon: '🎓', art: 'uni',
      beschreibung: 'Module, Vorlesungen, Abgaben und Literatur als eine Sicht.'
    },
    {
      key: 'arbeit', name: 'Arbeit', icon: '💼', art: 'arbeit',
      beschreibung: 'Projekte, Termine, Dokumente und Aufgaben im beruflichen Kontext.'
    },
    {
      key: 'privat', name: 'Privat', icon: '🏠', art: 'privat',
      beschreibung: 'Persönliche Vorhaben und Alltag getrennt filtern, ohne Daten zu kopieren.'
    }
  ];

  let laufend: Promise<Ergebnis> | null = null;
  let startLaeuft: Promise<boolean> | null = null;

  const esc = (wert: unknown): string => String(wert ?? '').replace(/[&<>"']/g, zeichen =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[zeichen] || zeichen);

  const text = (wert: unknown, max = 180): string =>
    String(wert ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

  const eindeutig = (werte: unknown, max = 64): string[] => {
    const raus: string[] = [], gesehen = new Set<string>();
    for (const wert of Array.isArray(werte) ? werte : []) {
      const id = text(wert);
      if (!id || gesehen.has(id)) continue;
      gesehen.add(id);
      raus.push(id);
      if (raus.length >= max) break;
    }
    return raus;
  };

  const weltVon = (wert: unknown): Hauptwelt =>
    wert === 'lernen' || wert === 'workspace' || wert === 'beide' ? wert : 'beide';

  const aktorKey = (): string => {
    const konto = typeof Konten !== 'undefined' && typeof Konten.aktiv === 'function'
      ? Konten.aktiv() : null;
    const id = text(konto?.id, 160);
    return id ? 'konto:' + encodeURIComponent(id) : 'geraet:local';
  };

  const normalisiereProfil = (wert: any): Profil => {
    const status: Status = wert?.status === 'fertig' || wert?.status === 'uebersprungen'
      ? wert.status : 'neu';
    return {
      version: 1,
      status,
      welt: weltVon(wert?.welt),
      auswahl: eindeutig(wert?.auswahl, BEREICHE.length)
        .filter(key => BEREICHE.some(bereich => bereich.key === key)),
      bereichIds: eindeutig(wert?.bereichIds),
      updatedAt: text(wert?.updatedAt, 40)
    };
  };

  const metaLesen = (): { version: 1; profile: Record<string, Profil> } => {
    const roh = Store.getMeta(META_KEY, {});
    const profile = roh && typeof roh === 'object' && !Array.isArray(roh) &&
      roh.profile && typeof roh.profile === 'object' && !Array.isArray(roh.profile)
      ? roh.profile as Record<string, Profil> : {};
    return { version: 1, profile };
  };

  const profilLesen = (): Profil => normalisiereProfil(metaLesen().profile[aktorKey()]);

  const profilSchreiben = (profil: Profil): void => {
    const meta = metaLesen();
    Store.setMeta(META_KEY, {
      version: 1,
      profile: { ...meta.profile, [aktorKey()]: normalisiereProfil(profil) }
    });
  };

  const rechteAktiv = (): boolean =>
    typeof Konten !== 'undefined' && typeof Konten.darf === 'function';

  const darfBereicheAendern = (): boolean => {
    if (!rechteAktiv()) return true;
    const pageId = typeof App !== 'undefined' && typeof App.aktuelleSeite === 'function'
      ? text(App.aktuelleSeite()) : '';
    /* Sonderansichten wie „Heute" haben absichtlich keine Seiten-ID. Dort
       gilt dieselbe globale Rechtefrage wie in `Lebensbereiche.anlegen`;
       ein vorhandener Seitenkontext schränkt sie weiterhin auf diese Seite
       ein. Beide Wege bleiben bei einem ablehnenden Kontenmodul fail-closed. */
    return pageId ? Konten.darf('bearbeiten', pageId) : Konten.darf('bearbeiten');
  };

  const bereichApi = (): any => {
    if (typeof Lebensbereiche !== 'undefined') return Lebensbereiche;
    return (window as any).Lebensbereiche || null;
  };

  const vorhandeneBereiche = (): any[] => {
    const api = bereichApi();
    if (!api || typeof api.auflisten !== 'function') return [];
    try {
      const liste = api.auflisten();
      return Array.isArray(liste) ? liste : [];
    } catch { return []; }
  };

  const gefaltet = (wert: unknown): string => text(wert, 100).toLocaleLowerCase('de-CH')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

  const vorhandenFuer = (vorgabe: BereichVorgabe, liste = vorhandeneBereiche()): any | null =>
    liste.find(bereich => gefaltet(bereich?.name) === gefaltet(vorgabe.name)) ||
    liste.find(bereich => text(bereich?.art, 40) === vorgabe.art) || null;

  const stilSicherstellen = (): void => {
    if (document.getElementById(STIL_ID)) return;
    const stil = document.createElement('style');
    stil.id = STIL_ID;
    stil.textContent = `
      .produkt-onboarding-lage {
        position: fixed; inset: 0; z-index: 10050; box-sizing: border-box;
        display: grid; place-items: center; padding: 12px;
        background: color-mix(in srgb, #101217 62%, transparent);
        overscroll-behavior: contain;
      }
      .produkt-onboarding-lage *, .produkt-onboarding-lage *::before,
      .produkt-onboarding-lage *::after { box-sizing: border-box; }
      .produkt-onboarding {
        width: min(680px, calc(100vw - 24px)); max-width: 100%;
        max-height: min(780px, calc(100dvh - 24px)); overflow: hidden;
        display: flex; flex-direction: column; border: 1px solid var(--border, #d9dce2);
        border-radius: 18px; color: var(--text, #1f2329); background: var(--bg, #fff);
        box-shadow: 0 24px 80px rgb(0 0 0 / .28);
      }
      .produkt-onboarding-kopf {
        display: flex; align-items: center; gap: 12px; padding: 18px 20px 12px;
        border-bottom: 1px solid var(--border, #e2e4e9);
      }
      .produkt-onboarding-marke {
        width: 42px; height: 42px; flex: 0 0 42px; display: grid; place-items: center;
        border-radius: 12px; background: color-mix(in srgb, var(--accent, #d62b3a) 13%, transparent);
        font-size: 22px;
      }
      .produkt-onboarding-kopftext { min-width: 0; flex: 1; }
      .produkt-onboarding-kopftext strong { display: block; font-size: 16px; }
      .produkt-onboarding-kopftext span { color: var(--text-faint, #6d7280); font-size: 12.5px; }
      .produkt-onboarding-schliessen {
        width: 44px; height: 44px; flex: 0 0 44px; border: 0; border-radius: 10px;
        color: inherit; background: transparent; font: inherit; font-size: 19px; cursor: pointer;
      }
      .produkt-onboarding-schliessen:hover { background: var(--bg-hover, #f1f2f5); }
      .produkt-onboarding-fortschritt {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px;
        margin: 0; padding: 12px 20px 0; list-style: none;
      }
      .produkt-onboarding-fortschritt li {
        min-width: 0; color: var(--text-faint, #737886); font-size: 11.5px;
      }
      .produkt-onboarding-fortschritt li::before {
        content: ''; display: block; height: 4px; margin-bottom: 5px;
        border-radius: 999px; background: var(--bg-hover, #e9ebef);
      }
      .produkt-onboarding-fortschritt li[data-erreicht="ja"]::before {
        background: var(--accent, #d62b3a);
      }
      .produkt-onboarding-fortschritt li[aria-current="step"] {
        color: var(--text, #1f2329); font-weight: 650;
      }
      .produkt-onboarding-inhalt {
        min-height: 320px; padding: 22px 24px; overflow: auto; overflow-x: hidden;
      }
      .produkt-onboarding-inhalt h1 { margin: 0 0 8px; font-size: clamp(23px, 4vw, 31px); line-height: 1.15; }
      .produkt-onboarding-inhalt > p { margin: 0 0 20px; color: var(--text-faint, #666d79); line-height: 1.55; }
      .produkt-onboarding fieldset { min-width: 0; margin: 0; padding: 0; border: 0; }
      .produkt-onboarding legend { width: 100%; margin-bottom: 10px; font-weight: 700; }
      .produkt-onboarding-welten { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .produkt-onboarding-welt, .produkt-onboarding-bereich {
        position: relative; display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 12px;
        min-width: 0; padding: 15px; border: 1px solid var(--border, #dfe2e8);
        border-radius: 13px; cursor: pointer; background: var(--bg-card, #fff);
      }
      .produkt-onboarding-welt:first-of-type { grid-column: 1 / -1; }
      .produkt-onboarding-welt:has(input:checked), .produkt-onboarding-bereich:has(input:checked) {
        border-color: var(--accent, #d62b3a);
        background: color-mix(in srgb, var(--accent, #d62b3a) 7%, var(--bg-card, #fff));
      }
      .produkt-onboarding-welt input, .produkt-onboarding-bereich input {
        width: 19px; height: 19px; margin: 2px 0 0; accent-color: var(--accent, #d62b3a);
      }
      .produkt-onboarding-welt b, .produkt-onboarding-bereich b { display: block; margin-bottom: 4px; }
      .produkt-onboarding-welt small, .produkt-onboarding-bereich small {
        display: block; color: var(--text-faint, #69707d); line-height: 1.4;
      }
      .produkt-onboarding-bereiche { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .produkt-onboarding-bereich .po-icon { font-size: 21px; line-height: 1; }
      .produkt-onboarding-bereich input { position: absolute; right: 13px; top: 13px; }
      .produkt-onboarding-bereich > span:last-child { padding-right: 24px; }
      .produkt-onboarding-bereich[data-gesperrt="ja"] { opacity: .58; cursor: not-allowed; }
      .produkt-onboarding-hinweis {
        margin-top: 14px; padding: 11px 13px; border-radius: 10px;
        color: var(--text-faint, #676e79); background: var(--bg-hover, #f3f4f6); font-size: 12.5px; line-height: 1.45;
      }
      .produkt-onboarding-zusammenfassung {
        display: grid; gap: 10px; margin: 0; padding: 0; list-style: none;
      }
      .produkt-onboarding-zusammenfassung li {
        display: flex; align-items: flex-start; gap: 12px; padding: 13px 14px;
        border-radius: 11px; background: var(--bg-hover, #f4f5f7);
      }
      .produkt-onboarding-zusammenfassung b { display: block; }
      .produkt-onboarding-zusammenfassung small { color: var(--text-faint, #6d7280); }
      .produkt-onboarding-fehler { min-height: 20px; margin: 12px 24px 0; color: #b4232f; font-size: 13px; }
      .produkt-onboarding-fuss {
        display: flex; align-items: center; gap: 9px; padding: 14px 20px 18px;
        border-top: 1px solid var(--border, #e1e3e8);
      }
      .produkt-onboarding-fuss button {
        min-height: 44px; padding: 9px 15px; border: 1px solid var(--border, #d9dce2);
        border-radius: 10px; color: inherit; background: var(--bg, #fff); font: inherit;
        font-weight: 620; cursor: pointer;
      }
      .produkt-onboarding-fuss button:hover:not(:disabled) { background: var(--bg-hover, #f1f2f5); }
      .produkt-onboarding-fuss button:disabled { opacity: .52; cursor: wait; }
      .produkt-onboarding-fuss .po-ueberspringen { margin-right: auto; border-color: transparent; color: var(--text-faint, #686e7a); }
      .produkt-onboarding-fuss .po-weiter, .produkt-onboarding-fuss .po-fertig {
        border-color: var(--accent, #d62b3a); color: #fff; background: var(--accent, #d62b3a);
      }
      .produkt-onboarding :focus-visible { outline: 3px solid color-mix(in srgb, var(--accent, #d62b3a) 45%, transparent); outline-offset: 2px; }
      @media (max-width: 520px) {
        .produkt-onboarding-lage { align-items: end; padding: 0; }
        .produkt-onboarding { width: 100vw; max-height: 96dvh; border-radius: 18px 18px 0 0; border-bottom: 0; }
        .produkt-onboarding-kopf { padding: 14px 14px 10px; }
        .produkt-onboarding-fortschritt { padding: 10px 14px 0; }
        .produkt-onboarding-fortschritt li { font-size: 10.5px; }
        .produkt-onboarding-inhalt { min-height: 0; padding: 18px 16px; }
        .produkt-onboarding-welten, .produkt-onboarding-bereiche { grid-template-columns: 1fr; }
        .produkt-onboarding-welt:first-of-type { grid-column: auto; }
        .produkt-onboarding-fehler { margin-inline: 16px; }
        .produkt-onboarding-fuss { padding: 12px 14px max(14px, env(safe-area-inset-bottom)); flex-wrap: wrap; }
        .produkt-onboarding-fuss .po-ueberspringen { order: 3; width: 100%; margin: 0; }
        .produkt-onboarding-fuss .po-zurueck { margin-right: auto; }
      }
      @media (prefers-reduced-motion: reduce) {
        .produkt-onboarding-lage *, .produkt-onboarding-lage *::before { scroll-behavior: auto !important; transition: none !important; }
      }
    `;
    document.head.appendChild(stil);
  };

  const weltName = (welt: Hauptwelt): string =>
    welt === 'lernen' ? '🎓 Lernen & Alltag' : welt === 'workspace' ? '🧱 Workspace' : 'Beide Hauptwelten';

  const oeffnen = (): Promise<Ergebnis> => {
    if (laufend) return laufend;
    if (typeof document === 'undefined' || !document.body)
      return Promise.reject(new Error('Das Onboarding braucht ein geöffnetes Redion-Fenster.'));

    laufend = new Promise<Ergebnis>(resolve => {
      stilSicherstellen();
      const vorherFokus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const gespeichert = profilLesen();
      let schritt = 1;
      let welt = gespeichert.welt;
      let sichert = false;
      const bestehend = vorhandeneBereiche();
      const bekannteIds = new Set<string>();
      BEREICHE.forEach(vorgabe => {
        const bereich = vorhandenFuer(vorgabe, bestehend);
        if (bereich?.id) bekannteIds.add(text(bereich.id));
      });
      const fremdeBereichIds = gespeichert.bereichIds.filter(id => !bekannteIds.has(id));
      const auswahl = new Set<string>(gespeichert.auswahl);
      if (!auswahl.size) BEREICHE.forEach(vorgabe => {
        const bereich = vorhandenFuer(vorgabe, bestehend);
        if (bereich?.id && gespeichert.bereichIds.includes(text(bereich.id))) auswahl.add(vorgabe.key);
      });

      const lage = document.createElement('div');
      lage.className = 'produkt-onboarding-lage';
      lage.innerHTML =
        '<section class="produkt-onboarding" role="dialog" aria-modal="true" ' +
          'aria-labelledby="produkt-onboarding-titel" aria-describedby="produkt-onboarding-beschreibung">' +
          '<header class="produkt-onboarding-kopf">' +
            '<span class="produkt-onboarding-marke" aria-hidden="true">R</span>' +
            '<span class="produkt-onboarding-kopftext"><strong>Redion einrichten</strong>' +
              '<span>Nur Ansichten und Vorlieben – deine Inhalte bleiben, wo sie sind.</span></span>' +
            '<button class="produkt-onboarding-schliessen" type="button" data-po="skip" ' +
              'aria-label="Onboarding überspringen und schließen">✕</button>' +
          '</header>' +
          '<ol class="produkt-onboarding-fortschritt" aria-label="Fortschritt">' +
            '<li data-po-step="1">Hauptwelt</li><li data-po-step="2">Bereiche</li>' +
            '<li data-po-step="3">Fertig</li>' +
          '</ol>' +
          '<main class="produkt-onboarding-inhalt"></main>' +
          '<p class="produkt-onboarding-fehler" role="alert" aria-live="assertive"></p>' +
          '<footer class="produkt-onboarding-fuss"></footer>' +
        '</section>';
      document.body.appendChild(lage);

      const dialog = lage.querySelector<HTMLElement>('.produkt-onboarding') as HTMLElement;
      const inhalt = lage.querySelector<HTMLElement>('.produkt-onboarding-inhalt') as HTMLElement;
      const fuss = lage.querySelector<HTMLElement>('.produkt-onboarding-fuss') as HTMLElement;
      const fehler = lage.querySelector<HTMLElement>('.produkt-onboarding-fehler') as HTMLElement;

      const fokusierbar = (): HTMLElement[] => [...dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')]
        .filter(element => element.offsetParent !== null);

      const beenden = (ergebnis: Ergebnis): void => {
        lage.remove();
        laufend = null;
        vorherFokus?.focus();
        resolve(ergebnis);
      };

      const ueberspringen = (): void => {
        if (sichert) return;
        const profil: Profil = {
          version: 1,
          status: 'uebersprungen',
          welt,
          auswahl: [...auswahl],
          bereichIds: gespeichert.bereichIds,
          updatedAt: new Date().toISOString()
        };
        profilSchreiben(profil);
        beenden({ status: 'uebersprungen', welt, bereichIds: profil.bereichIds });
      };

      const fortschritt = (): void => {
        lage.querySelectorAll<HTMLElement>('[data-po-step]').forEach(element => {
          const nummer = Number(element.dataset.poStep);
          if (nummer === schritt) element.setAttribute('aria-current', 'step');
          else element.removeAttribute('aria-current');
          element.dataset.erreicht = nummer <= schritt ? 'ja' : 'nein';
        });
      };

      const fussZeichnen = (): void => {
        fuss.innerHTML =
          '<button type="button" class="po-ueberspringen" data-po="skip">Überspringen</button>' +
          (schritt > 1 ? '<button type="button" class="po-zurueck" data-po="back">Zurück</button>' : '') +
          (schritt < 3
            ? '<button type="button" class="po-weiter" data-po="next">Weiter</button>'
            : '<button type="button" class="po-fertig" data-po="finish">Einrichtung abschließen</button>');
      };

      const schrittEins = (): void => {
        inhalt.innerHTML =
          '<h1 id="produkt-onboarding-titel">Wie möchtest du Redion zuerst sehen?</h1>' +
          '<p id="produkt-onboarding-beschreibung">Beide Welten arbeiten mit denselben Seiten, ' +
            'Datenbanken und Dateien. Du legst nur deinen bevorzugten Einstieg fest.</p>' +
          '<fieldset><legend>Bevorzugte Hauptwelt</legend><div class="produkt-onboarding-welten">' +
            '<label class="produkt-onboarding-welt"><input type="radio" name="po-welt" value="beide"' +
              (welt === 'beide' ? ' checked' : '') + '><span><b>🎓 + 🧱 Beide</b>' +
              '<small>Lernen & Alltag und Workspace gleichwertig verwenden.</small></span></label>' +
            '<label class="produkt-onboarding-welt"><input type="radio" name="po-welt" value="lernen"' +
              (welt === 'lernen' ? ' checked' : '') + '><span><b>🎓 Lernen & Alltag</b>' +
              '<small>Heute, Lernen, Aufgaben, Termine und Fortschritt stehen vorn.</small></span></label>' +
            '<label class="produkt-onboarding-welt"><input type="radio" name="po-welt" value="workspace"' +
              (welt === 'workspace' ? ' checked' : '') + '><span><b>🧱 Workspace</b>' +
              '<small>Seiten, Dokumente, Datenbanken, PDFs und Whiteboards stehen vorn.</small></span></label>' +
          '</div></fieldset>';
      };

      const schrittZwei = (): void => {
        const apiDa = !!bereichApi();
        const darf = darfBereicheAendern();
        const liste = vorhandeneBereiche();
        inhalt.innerHTML =
          '<h1 id="produkt-onboarding-titel">Welche Lebensbereiche brauchst du?</h1>' +
          '<p id="produkt-onboarding-beschreibung">Ein Inhalt darf später in mehreren Bereichen erscheinen. ' +
            'Hier entstehen nur Filterbereiche – keine Seiten- oder Dateikopien.</p>' +
          '<fieldset><legend>Bereiche auswählen</legend><div class="produkt-onboarding-bereiche">' +
            BEREICHE.map(vorgabe => {
              const vorhanden = vorhandenFuer(vorgabe, liste);
              const gesperrt = !vorhanden && (!apiDa || !darf);
              if (gesperrt) auswahl.delete(vorgabe.key);
              return '<label class="produkt-onboarding-bereich" data-gesperrt="' +
                (gesperrt ? 'ja' : 'nein') + '">' +
                '<span class="po-icon" aria-hidden="true">' + esc(vorgabe.icon) + '</span>' +
                '<span><b>' + esc(vorgabe.name) + '</b><small>' + esc(vorgabe.beschreibung) +
                  (vorhanden ? ' Bereits vorhanden.' : gesperrt ? ' Keine Berechtigung zum Anlegen.' : '') +
                '</small></span><input type="checkbox" data-po-area="' + esc(vorgabe.key) + '"' +
                  (auswahl.has(vorgabe.key) ? ' checked' : '') + (gesperrt ? ' disabled' : '') +
                  ' aria-label="' + esc(vorgabe.name) + ' auswählen"></label>';
            }).join('') +
          '</div></fieldset>' +
          '<div class="produkt-onboarding-hinweis">Du ordnest noch keine bestehenden Inhalte zu. ' +
            'Bereichszuordnungen geschehen später einzeln und ausdrücklich.</div>';
      };

      const schrittDrei = (): void => {
        const gewaehlt = BEREICHE.filter(vorgabe => auswahl.has(vorgabe.key));
        inhalt.innerHTML =
          '<h1 id="produkt-onboarding-titel">Bereit für Redion</h1>' +
          '<p id="produkt-onboarding-beschreibung">Prüfe deine Auswahl. Erst der Abschluss speichert ' +
            'die Vorliebe und legt fehlende Bereichsdefinitionen an.</p>' +
          '<ul class="produkt-onboarding-zusammenfassung">' +
            '<li><span aria-hidden="true">◫</span><span><b>' + esc(weltName(welt)) + '</b>' +
              '<small>Dein bevorzugter Einstieg; alle Daten bleiben gemeinsam.</small></span></li>' +
            '<li><span aria-hidden="true">🏷</span><span><b>' +
              (gewaehlt.length ? gewaehlt.map(vorgabe => esc(vorgabe.icon + ' ' + vorgabe.name)).join(', ') : 'Keine neuen Bereiche') +
              '</b><small>' + (gewaehlt.length
                ? 'Die Auswahl wird als Ansichtspräferenz gespeichert.'
                : 'Du kannst Bereiche später jederzeit anlegen.') + '</small></span></li>' +
            '<li><span aria-hidden="true">✓</span><span><b>Keine Inhaltsänderung</b>' +
              '<small>Keine Seite, Aufgabe, Datei oder Lernkarte wird verschoben oder kopiert.</small></span></li>' +
          '</ul>';
      };

      const zeichnen = (): void => {
        fehler.textContent = '';
        fortschritt();
        if (schritt === 1) schrittEins();
        else if (schritt === 2) schrittZwei();
        else schrittDrei();
        fussZeichnen();
        inhalt.scrollTop = 0;
        const ziel = inhalt.querySelector<HTMLElement>('input:checked, input:not([disabled]), button') ||
          fuss.querySelector<HTMLElement>('button');
        setTimeout(() => ziel?.focus(), 0);
      };

      const abschliessen = async (): Promise<void> => {
        if (sichert) return;
        sichert = true;
        dialog.querySelectorAll<HTMLButtonElement>('button').forEach(button => { button.disabled = true; });
        fehler.textContent = '';
        try {
          const api = bereichApi();
          const liste = vorhandeneBereiche();
          const ids: string[] = [...fremdeBereichIds];
          for (const vorgabe of BEREICHE.filter(eintrag => auswahl.has(eintrag.key))) {
            let bereich = vorhandenFuer(vorgabe, liste);
            if (!bereich) {
              if (!api || typeof api.anlegen !== 'function')
                throw new Error('Der Bereichskern ist noch nicht geladen.');
              if (!darfBereicheAendern())
                throw new Error('Du darfst keine neuen Bereiche anlegen.');
              bereich = api.anlegen({ name: vorgabe.name, icon: vorgabe.icon, art: vorgabe.art });
              if (bereich) liste.push(bereich);
            }
            const id = text(bereich?.id);
            if (id && !ids.includes(id)) ids.push(id);
          }
          const profil: Profil = {
            version: 1,
            status: 'fertig',
            welt,
            auswahl: [...auswahl],
            bereichIds: eindeutig(ids),
            updatedAt: new Date().toISOString()
          };
          profilSchreiben(profil);
          /* DIE WELT IST EIN EINSTIEG, KEINE STARTANSICHT (E349). Hier stand
             `startAnsicht` = 'workspace' bzw. 'start' — ungefragt, und damit
             sah, wer das Onboarding durchlief, nie mehr seine PDF beim Start,
             egal was E236 versprach. Der Start zeigt, wo man war; die Welt
             steht im Profil und in der Seitenleiste. */
          beenden({ status: 'fertig', welt, bereichIds: profil.bereichIds });
          /* Die Auswahl ist ein bevorzugter Einstieg, keine neue Datenwelt.
             Nach dem Schliessen wird deshalb nur die gewünschte Sicht
             geöffnet; alle Objekte darunter bleiben dieselben. */
          setTimeout(() => {
            const produkt = (globalThis as any).Produktwelten;
            if (welt === 'workspace') produkt?.workspace?.('start');
            else if (welt === 'lernen') produkt?.lernen?.('heute');
          }, 0);
        } catch (grund) {
          sichert = false;
          dialog.querySelectorAll<HTMLButtonElement>('button').forEach(button => { button.disabled = false; });
          fehler.textContent = grund instanceof Error ? grund.message : 'Die Einrichtung konnte nicht gespeichert werden.';
          fuss.querySelector<HTMLElement>('[data-po="finish"]')?.focus();
        }
      };

      lage.addEventListener('change', ereignis => {
        const element = ereignis.target instanceof HTMLInputElement ? ereignis.target : null;
        if (!element) return;
        if (element.name === 'po-welt') welt = weltVon(element.value);
        const key = text(element.dataset.poArea, 40);
        if (key) {
          if (element.checked) auswahl.add(key); else auswahl.delete(key);
        }
      });

      lage.addEventListener('click', ereignis => {
        const element = ereignis.target instanceof Element
          ? ereignis.target.closest<HTMLElement>('[data-po]') : null;
        const aktion = element?.dataset.po;
        if (aktion === 'skip') { ueberspringen(); return; }
        if (aktion === 'back' && schritt > 1) { schritt--; zeichnen(); return; }
        if (aktion === 'next' && schritt < 3) { schritt++; zeichnen(); return; }
        if (aktion === 'finish') void abschliessen();
      });

      lage.addEventListener('keydown', ereignis => {
        if (ereignis.key === 'Escape') {
          ereignis.preventDefault();
          ueberspringen();
          return;
        }
        if (ereignis.key !== 'Tab') return;
        const elemente = fokusierbar();
        if (!elemente.length) { ereignis.preventDefault(); dialog.focus(); return; }
        const erstes = elemente[0] as HTMLElement;
        const letztes = elemente[elemente.length - 1] as HTMLElement;
        if (ereignis.shiftKey && document.activeElement === erstes) {
          ereignis.preventDefault(); letztes.focus();
        } else if (!ereignis.shiftKey && document.activeElement === letztes) {
          ereignis.preventDefault(); erstes.focus();
        }
      });

      zeichnen();
    });
    return laufend;
  };

  /** Startet höchstens einmal gleichzeitig und schreibt beim Start nichts. */
  const vielleichtStarten = (): Promise<boolean> => {
    if (startLaeuft) return startLaeuft;
    startLaeuft = (async () => {
      if (profilLesen().status !== 'neu') return false;
      if (typeof document === 'undefined') return false;
      if (!document.body) await new Promise<void>(resolve =>
        document.addEventListener('DOMContentLoaded', () => resolve(), { once: true }));
      if (profilLesen().status !== 'neu') return false;
      void oeffnen();
      return true;
    })().finally(() => { startLaeuft = null; });
    return startLaeuft;
  };

  /** Löscht nur die persönliche Onboarding-Präferenz, niemals Bereiche/Inhalte. */
  const zuruecksetzen = (): void => {
    const meta = metaLesen();
    const profile = { ...meta.profile };
    delete profile[aktorKey()];
    Store.setMeta(META_KEY, { version: 1, profile });
  };

  return { vielleichtStarten, oeffnen, zuruecksetzen, profil: profilLesen };
})();

(window as any).ProduktOnboarding = ProduktOnboarding;
