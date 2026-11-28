/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/einstellungen/ansicht/seite.ts (npm run bauen:ts). */
/* ============================================================================
 * einstellungen.js — Der Einstellungsbereich
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/einstellungen/ansicht/seite.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/einstellungen/ansicht/seite.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Nach Notions Vorbild aufgebaut: links die Bereiche, rechts die Optionen.
 * Was bei Notion nur mit Konto und Server geht (Mitglieder, Abrechnung,
 * SSO), steht hier als das da, was es lokal bedeutet — ehrlich benannt,
 * nicht weggelassen.
 * ==========================================================================*/

const Einstellungen = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  const esc = (s: any) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* Alles, was hier eingestellt wird, liegt in meta. */
  const V = (k: any, fallback: any) => Store.getMeta(k, fallback);
  const S = (k: any, v: any) => { Store.setMeta(k, v); anwenden(); };

  /* Wie in Notion in Abschnitte geordnet, nicht als eine lange Liste. */
  /* Die Navigation links: Überschrift und darunter die Bereiche als
     [Kennung, Zeichen, Name]. Ohne diesen Typ liest TypeScript aus dem
     Literal ein Gemisch aus Text und Listen und kann `liste.map` nicht.

     DAS ZEICHEN IST EIN NAME AUS `Register.symbole`, KEIN EMOJI MEHR (E701).
     Hier standen neunzehn verschiedene farbige Bildchen untereinander —
     Person, Zahnrad, Glocke, Funken, Stecker … —, jedes mit eigener Farbe,
     eigener Strichstärke und eigener Grundlinie, auf jedem System anders.
     Redur hat am 27. September „Gezeichnete Zeichen" gewählt: „Durch
     Redions eigene Linien-Symbole ersetzen, wie in der Zeichenleiste. Alles
     bleibt am selben Ort." Also dieselben neunzehn Zeilen in derselben
     Folge, dieselben Kennungen und Wörter — nur das Bild ist jetzt ein
     Strich in `currentColor` (test580 §3). */
  type Eintrag = [string, string, string];
  type Gruppe = [string, Eintrag[]];

  const GRUPPEN: Gruppe[] = [
    ['', [
      ['konto',        'user',        'Mein Konto'],
      ['allgemein',    'settings',    'Einstellungen'],
      ['benachricht',  'bell',        'Benachrichtigungen'],
      ['daten',        'upload',      'Importieren']
    ]],
    ['Funktionen', [
      ['ki',           'sparkle',     'Künstliche Intelligenz'],
      ['verbindungen', 'plug',        'Verbindungen'],
      ['mcp',          'link',        'MCP'],
      ['worker',       'keyboard',    'Worker'],
      ['verifiziert',  'checkCircle', 'Verifizierte Seiten'],
      ['oeffentlich',  'globe',       'Öffentliche Seiten'],
      ['emoji',        'smile',       'Emoji']
    ]],
    ['Verwaltung', [
      ['geraete',      'workspace',   'iPhone und Windows'],
      ['home-server',  'database',    'RED Home Server'],
      ['arbeitsplatz', 'workspace',   'Arbeitsbereich'],
      ['analysen',     'chart',       'Analysen'],
      ['bereiche',     'users',       'Bereiche'],
      ['sicherheit',   'shield',      'Sicherheit'],
      ['schluessel',   'key',         'Schlüssel und APIs']
    ]],
    ['Zugriff und Abrechnung', [
      ['speicher',     'database',    'Speicher'],
      ['abrechnung',   'creditCard',  'Abrechnung'],
      ['ueber',        'info',        'Über diese App']
    ]]
  ];

  /** Ein Zeichen aus dem Register — oder nichts, wenn es fehlt. Eine leere
      Zelle ist ehrlicher als ein Emoji als Ersatz: das wäre der alte
      Zustand, nur versteckt (E701). */
  const zeichen = (name: string): string => {
    try { return Register.symbole.alsSvg(name, 18); } catch { return ''; }
  };

  const BEREICHE = GRUPPEN.flatMap(([, liste]) => liste);

  /* DIE FARBE DES QUADRATS (E812). Wie bei den iPhone-Einstellungen trägt jede
     Zeile ein eigenes farbiges Feld mit weissem Zeichen. Die Farbe ist nur
     ein Erkennungszeichen — der Name steht daneben und trägt die Bedeutung.
     Die Namen sind Tokens aus `bausteine.css`/`dunkel.css`; eine Kennung ohne
     Eintrag bekommt das Grau. */
  const FARBE: Record<string, string> = {
    konto: 'grau', allgemein: 'grau', benachricht: 'rot', daten: 'blau',
    ki: 'lila', verbindungen: 'blau', mcp: 'orange', worker: 'grau',
    verifiziert: 'gruen', oeffentlich: 'blau', emoji: 'gelb',
    geraete: 'gruen', 'home-server': 'grau', arbeitsplatz: 'orange', analysen: 'rosa', bereiche: 'lila',
    sicherheit: 'rot', schluessel: 'gelb', speicher: 'grau', abrechnung: 'gruen', ueber: 'grau'
  };

  /* Die Kopfleiste der Detailseite (E812, Zusatz): „‹ Einstellungen" links, der
     Name des Bereichs in der Mitte. Sie ist sticky und trägt den Glas-Zustand. */
  const kopfLeiste = (): string => {
    const name = BEREICHE.find(([id]) => id === offenerBereich)?.[2] ?? '';
    return '<div class="einst-leiste"><button class="einst-zurueck" data-a="liste" ' +
      'aria-label="Zurück zu den Einstellungen">‹ Einstellungen</button>' +
      `<span class="einst-leiste-titel">${esc(name)}</span></div>`;
  };

  /* Die Suche (E812): tippen blendet Bereiche aus, die nicht passen, und
     Gruppen, in denen nichts mehr steht. `hidden` statt Entfernen — die
     Griffe bleiben im Baum und ihre Reihenfolge unverändert (§43). */
  const sucheAnwenden = (o: HTMLElement, wort: string): void => {
    const w = wort.trim().toLowerCase();
    o.querySelectorAll<HTMLElement>('.einst-nav .einst-karte').forEach(karte => {
      let treffer = 0;
      karte.querySelectorAll<HTMLButtonElement>('button[data-b]').forEach(b => {
        const passt = !w || (b.textContent ?? '').toLowerCase().includes(w);
        b.hidden = !passt;
        if (passt) treffer++;
      });
      karte.hidden = treffer === 0;
      const kopf = karte.previousElementSibling;
      if (kopf instanceof HTMLElement && kopf.classList.contains('einst-grp')) kopf.hidden = treffer === 0;
    });
  };

  /* Die Zeilen der Detailseite in Karten fassen (E812): jede Folge aufeinander
     folgender `.ez-zeile` bekommt einen Kasten `.ez-karte`. Die Zeilen selbst
     bleiben unverändert — nur die Hülle kommt dazu, und Listener auf den Zeilen
     bleiben, weil nur verschoben wird. */
  const zeilenKarten = (ziel: HTMLElement): void => {
    let karte: HTMLElement | null = null;
    [...ziel.children].forEach(kind => {
      if (kind instanceof HTMLElement && kind.classList.contains('ez-zeile')) {
        if (!karte) {
          karte = document.createElement('div');
          karte.className = 'ez-karte';
          kind.before(karte);
        }
        karte.appendChild(kind);
      } else {
        karte = null;
      }
    });
  };

  /* ========================================================================
   * ANWENDEN — Einstellungen wirken sofort
   * ======================================================================*/
  const anwenden = () => {
    document.documentElement.dataset.theme = V('theme', 'dark');
    document.body.dataset.schrift = V('schriftgroesse', 'normal');
    document.body.dataset.dichte  = V('dichte', 'normal');
    document.body.classList.toggle('kontrast', !!V('kontrast', false));
    /* Barrierefreiheit: ruhige Darstellung, leichteres Lesen, hoher Kontrast */
    document.body.dataset.bewegung = V('bewegung', 'normal');
    /* Die Inseln hören mit (E702): das Kit fragt `data-ui-motion` (L222). */
    if (V('bewegung', 'normal') === 'ruhig') document.documentElement.dataset['uiMotion'] = 'reduce';
    else delete document.documentElement.dataset['uiMotion'];
    document.body.dataset.lesen    = V('lesen', 'normal');
    document.body.dataset.kontrast = V('kontrast', false) ? 'hoch' : 'normal';
    /* Das eigene Farbschema hat das letzte Wort — sonst würde die Zeile
       oben es bei jedem Anwenden wieder auf hell oder dunkel zurückdrehen. */
    if (typeof Aussehen !== 'undefined') Aussehen.anwenden();
  };

  /** Datum so ausgeben, wie es eingestellt ist. */
  const datum = (wert: any, mitZeit = false) => {
    if (!wert) return '';
    const d = new Date(wert);
    if (isNaN(d.getTime())) return String(wert);
    const t = String(d.getDate()).padStart(2, '0');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const j = d.getFullYear();
    const form = V('datumsformat', 'TT.MM.JJJJ');
    let s = form === 'JJJJ-MM-TT' ? `${j}-${m}-${t}`
          : form === 'MM/TT/JJJJ' ? `${m}/${t}/${j}`
          : form === 'TT. Monat JJJJ'
            ? `${d.getDate()}. ${['Januar','Februar','März','April','Mai','Juni','Juli','August',
                'September','Oktober','November','Dezember'][d.getMonth()]} ${j}`
            : `${t}.${m}.${j}`;
    if (mitZeit) {
      const st = d.getHours(), mi = String(d.getMinutes()).padStart(2, '0');
      s += V('zeitformat', '24') === '12'
        ? ` ${((st + 11) % 12) + 1}:${mi} ${st < 12 ? 'vorm.' : 'nachm.'}`
        : ` ${String(st).padStart(2, '0')}:${mi}`;
    }
    return s;
  };

  /** Beginnt die Woche am Montag? Der Kalender richtet sich danach. */
  const wochenstart = () => (V('wochenstart', 'montag') === 'sonntag' ? 0 : 1);

  /* ========================================================================
   * DER DIALOG
   * ======================================================================*/
  let offenerBereich = 'allgemein';

  /* Der Stand aus stand.ts (E361) — und der Weg, aus der Adresse gelesen. */
  const standFassung = (): string =>
    typeof Stand !== 'undefined' && Stand && Number(Stand.fassung) > 0 ? 'v' + Number(Stand.fassung) : '';
  const herkunft = (): string => {
    const ort = String(location.protocol || '');
    const wirt = String(location.hostname || '');
    if (ort === 'file:') return 'Ordner (Doppelklick auf index.html)';
    if (wirt === 'localhost' || wirt === '127.0.0.1' || wirt === '[::1]') return 'örtlicher Server (start.bat)';
    if (/\.workers\.dev$/.test(wirt) || /\.pages\.dev$/.test(wirt)) return 'Cloudflare (' + wirt + ')';
    return wirt ? 'Netz (' + wirt + ')' : 'unbekannter Weg';
  };
  const standText = (): string => {
    const fassung = standFassung();
    if (!fassung) return 'Stand unbekannt · ' + herkunft();
    const gebaut = typeof Stand !== 'undefined' && Stand.gebaut ? new Date(String(Stand.gebaut)) : null;
    const wann = gebaut && !isNaN(gebaut.getTime())
      ? ' · gebaut ' + gebaut.toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    return fassung + wann + ' · ' + herkunft();
  };

  const oeffne = (bereich?: any) => {
    offenerBereich = bereich || offenerBereich;
    document.querySelectorAll('.overlay').forEach(o => o.remove());

    /* ========================================================================
     * ZWEI SPALTEN AM RECHNER, ZWEI SEITEN AM TELEFON (Vorgabe §12, E58)
     * ------------------------------------------------------------------------
     * GEMESSEN AM 8. AUGUST BEI 390 PX, und es war die schlechteste Seite
     * der ganzen App: die Rechner-Aufteilung von 236 px Navigation plus
     * Inhalt lief unverändert weiter. Übrig blieben **129 Pixel** für den
     * Inhalt. Jede Beschreibung brach in Einzelwörter um — „Hell, dunkel
     * oder wie das System" stand als sechs Zeilen —, und die Auswahlfelder
     * daneben ragten über den Rand hinaus.
     *
     * Zwei Spalten passen nicht auf ein Telefon. Also zwei SEITEN: erst die
     * Liste der Bereiche, dann der gewählte Bereich mit einem Weg zurück.
     * Genau so macht es jedes Telefon-Betriebssystem, und aus demselben
     * Grund.
     *
     * `data-blick` sagt, welche der beiden gerade dran ist. Am Rechner
     * steht dieselbe Angabe da und ändert nichts — dort sind beide Spalten
     * immer sichtbar, und der Klick in die Liste zeichnet rechts neu.
     * ======================================================================*/
    const amTelefon = () => window.matchMedia('(max-width: 760px)').matches;

    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="einst-fenster" data-blick="liste">' +
        /* `data-material` (E706): die gewählte Zeile gleitet zur neuen. */
        '<div class="einst-nav">' +
          '<div class="einst-leiste einst-leiste-liste" aria-hidden="true"><span class="einst-leiste-titel">Einstellungen</span></div>' +
          /* Der grosse Titel und die Suche stehen oben, wie bei den
             iPhone-Einstellungen (E812). Der Titel ist ein Kopf für Menschen
             und für das Vorlesen; er trägt keine Funktion. */
          '<div class="einst-titel" role="heading" aria-level="1">Einstellungen</div>' +
          '<input type="search" class="einst-suche" placeholder="Suchen" ' +
            'aria-label="Einstellungen durchsuchen" autocomplete="off">' +
          `<div class="einst-konto"><span class="ws-icon">${esc(V('arbeitsIcon', 'N'))}</span>` +
          `<div><b>${esc(V('arbeitsName', 'Redion'))}</b>` +
          `<span>${esc(V('nutzer', 'Ohne Namen'))}</span></div></div>` +
          /* Jede Gruppe ist eine Karte mit runden Ecken; die Überschrift steht
             darüber, nicht darin (E812). */
          GRUPPEN.map(([titel, liste]) =>
            (titel ? `<div class="einst-grp">${titel}</div>` : '') +
            /* `data-material` sitzt auf der KARTE, nicht auf der Liste (E812):
               der Wechsel-Flug (`schale/bedienung/selection-flow.ts`) liest nur
               die DIREKTEN Kinder seines Trägers. Liegen die Zeilen in Karten,
               muss die Karte der Träger sein — sonst fliegt nichts. Der Flug
               bleibt innerhalb einer Gruppe; über eine Kartengrenze springt die
               Markierung (dokumentiert in E812). */
            '<div class="einst-karte" data-material="einstellungen">' +
            liste.map(([id, i, n]) =>
              `<button data-b="${id}" data-farbe="${FARBE[id] ?? 'grau'}" class="${id === offenerBereich ? 'on' : ''}">` +
              `<span class="mi">${zeichen(i)}</span>${n}</button>`).join('') +
            '</div>').join('') +
        '</div>' +
        /* Der Hinweis, dass die Liste weitergeht — siehe `mehrPruefen()`
           weiter unten. Er liegt NEBEN der Liste, nicht darin: `.einst-nav`
           rollt, und ein Kind darin würde mitrollen statt unten zu bleiben.
           `.einst-fenster` ist `position:relative`, also genügt das. */
        '<div class="einst-schleier" aria-hidden="true"></div>' +
        '<div class="einst-mehr" aria-hidden="true">\u2304</div>' +
        /* Der Weg zurück zur Liste — nur am Telefon zu sehen. Ohne ihn
           wäre die zweite Seite eine Sackgasse: das ✕ schliesst alles,
           und dann fängt man von vorn an. */
        '<div class="einst-inhalt" id="ei">' + kopfLeiste() +
        '</div>' +
        '<button class="einst-zu" data-a="zu" aria-label="Schliessen">✕</button>' +
      '</div>';
    document.body.appendChild(o);

    const fenster = o.querySelector<HTMLElement>('.einst-fenster');

    const zeichne = (): void => {
      const ziel = o.querySelector<HTMLElement>('#ei');
      if (ziel) ziel.innerHTML = kopfLeiste() + inhalt(offenerBereich);
      /* Am Rechner blendet der Bereich kurz über (E812, Zusatz). */
      if (ziel) { ziel.classList.remove('einst-ueber'); void ziel.offsetWidth; ziel.classList.add('einst-ueber'); }
      /* Glaskacheln unter „Einstellungen" (E712); die Felder bleiben (§43). */
      if (ziel && offenerBereich === 'allgemein' && typeof Schnellkacheln !== 'undefined')
        Schnellkacheln.einsetzen(ziel, { nach: ziel.querySelector(':scope > h2'), rolle: ziel });
      /* Die Zeilen in Karten fassen (E812) — nach den Glaskacheln, damit sie
         nicht zwischen einer Zeile und ihrer Karte landen. */
      if (ziel) zeilenKarten(ziel);
      o.querySelectorAll<HTMLElement>('.einst-nav button').forEach(b =>
        b.classList.toggle('on', b.dataset.b === offenerBereich));
      binde(o);
      if (ziel && offenerBereich === 'home-server') { bindeHomeServer(ziel); bindeRedApps(ziel); bindeRedShare(ziel); bindeRedStore(ziel); bindeRedSessions(ziel); bindeRedAppCenter(ziel); bindeRedReminders(ziel); bindeMcpHub(ziel); bindeLocalAi(ziel); }
      if (ziel && offenerBereich === 'mcp') RegisterAutomatisierung.montiereAnsicht(ziel);
    };
    zeichne();

    /* Die Suche: bei jedem Anschlag neu filtern (E812). */
    o.querySelector<HTMLInputElement>('.einst-suche')?.addEventListener('input', (e) =>
      sucheAnwenden(o, (e.target as HTMLInputElement).value));

    /* DER FOKUS LANDET NICHT IM SUCHFELD (E812). Der allgemeine Fokushalter
       (`ueberlagerung/fokus.ts`) nimmt beim Öffnen das erste greifbare Feld —
       hier wäre das die Suche, und am Telefon ginge die Bildschirmtastatur auf,
       bevor jemand etwas wollte. Er läuft nach einem Takt; wir stehen danach
       und setzen den Fokus auf die erste Zeile. Ein Feld, das der Mensch
       selbst anklickt, bleibt unberührt. */
    setTimeout(() => {
      const feld = o.querySelector<HTMLElement>('.einst-suche');
      /* `focusVisible: false`: der Fokus steht nur bereit, er ist nicht vom
         Menschen gewählt — ein Rahmen beim Öffnen wäre Lärm. Wer mit Tab
         kommt, sieht den Rahmen trotzdem (CSS `:focus-visible`). */
      if (feld && document.activeElement === feld)
        o.querySelector<HTMLElement>('.einst-nav button[data-b]')?.focus({ focusVisible: false } as FocusOptions);
    }, 30);

    /* ========================================================================
     * „ES GEHT NOCH WEITER" (E392)
     * ------------------------------------------------------------------------
     * GEMESSEN AM 4. SEPTEMBER, vor jeder Änderung: die Liste braucht 810 px
     * für 19 Einträge und drei Gruppenüberschriften, bekam aber nur 718 px
     * (1360×900), 632 (1280×720) oder 570 (1280×650). Verdeckt lagen immer
     * dieselben drei Einträge — Speicher, Abrechnung, Über diese App.
     *
     * Das Fenster ist jetzt hoch genug, dass auf einem gewöhnlichen Schirm
     * nichts mehr fehlt. Auf einem kleinen rollt die Liste weiterhin, und
     * DASS sie rollt, muss man sehen können. Der Rollbalken leistet das
     * nicht: er belegt ein Pixel und blendet sich aus.
     *
     * Also ein eigener Streifen — der WIEDER VERSCHWINDET, sobald man unten
     * angekommen ist. Eine Anzeige, die immer etwas anzeigt, wird nicht
     * gelesen; das ist der Fehler, in den diese App schon sechsmal gelaufen
     * ist. `test392 §3` misst genau das.
     *
     * Ein `ResizeObserver` statt eines Fensterhorchers: er hängt am Element,
     * verschwindet mit ihm und lässt beim Schliessen nichts zurück. Und er
     * feuert einmal von selbst, was den ersten Anstrich gleich mit erledigt.
     * ======================================================================*/
    const navEl = o.querySelector<HTMLElement>('.einst-nav');
    const mehrPruefen = (): void => {
      if (!navEl || !fenster) return;
      const rest = navEl.scrollHeight - navEl.clientHeight - navEl.scrollTop;
      fenster.classList.toggle('hat-mehr', rest > 4);
    };
    if (navEl) {
      navEl.addEventListener('scroll', mehrPruefen, { passive: true });
      new ResizeObserver(mehrPruefen).observe(navEl);
    }
    mehrPruefen();

    /* Am Telefon liegen Liste und Detailseite übereinander (E812, Zusatz):
       die Fahrt macht CSS aus `data-blick`. Die Seite, die gerade nicht dran
       ist, ist `inert` — sie bekommt keinen Fokus und keinen Klick. */
    const blick = (ziel: 'liste' | 'bereich'): void => {
      if (!fenster) return;
      fenster.setAttribute('data-blick', ziel);
      const inh = fenster.querySelector<HTMLElement>('.einst-inhalt');
      const nv = fenster.querySelector<HTMLElement>('.einst-nav');
      const amMobilgeraet = amTelefon();
      if (inh) inh.inert = amMobilgeraet && ziel === 'liste';
      if (nv) nv.inert = amMobilgeraet && ziel === 'bereich';
    };

    /* Schliessen: am Telefon gleitet das Blatt nach unten, am Rechner
       blendet es aus; bei weniger Bewegung sofort (E812, Zusatz). */
    const schliesse = (): void => {
      const wenig = AppEinstellung.wenigBewegung() ||
        document.body.dataset.bewegung === 'ruhig' ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!amTelefon() || wenig || !fenster) { o.remove(); return; }
      fenster.classList.add('einst-geht');
      let fertig = false;
      const weg = (): void => { if (fertig) return; fertig = true; o.remove(); };
      fenster.addEventListener('animationend', weg, { once: true });
      setTimeout(weg, 800);
    };

    /* Die Glasleiste: `einst-gerollt` sobald die Seite gerollt ist (E812, Zusatz). */
    const rollBeob = (rolle: HTMLElement): void => {
      const pruefe = (): void => { rolle.classList.toggle('einst-gerollt', rolle.scrollTop > 24); };
      rolle.addEventListener('scroll', pruefe, { passive: true });
      pruefe();
    };
    const eiEl = o.querySelector<HTMLElement>('#ei');
    if (eiEl) rollBeob(eiEl);
    if (navEl) rollBeob(navEl);

    /* Wischen vom linken Rand: die Detailseite folgt dem Finger; über die
       Mitte oder schnell losgelassen geht es zurück, sonst federt sie zurück
       (E812, Zusatz). Nur Telefon, nur vom Rand (x < 24). */
    if (eiEl && navEl && fenster) {
      const wischen = (fenst: HTMLElement, inh: HTMLElement, nv: HTMLElement): void => {
        let zug: { x: number; y: number; t: number } | null = null;
        let zieht = false;
        let dx = 0;
        inh.addEventListener('pointerdown', (e: PointerEvent) => {
          if (!amTelefon() || fenst.getAttribute('data-blick') !== 'bereich' || e.clientX > 24) return;
          zug = { x: e.clientX, y: e.clientY, t: performance.now() };
          zieht = false;
          dx = 0;
        });
        inh.addEventListener('pointermove', (e: PointerEvent) => {
          if (!zug) return;
          const ddx = e.clientX - zug.x;
          const ddy = e.clientY - zug.y;
          if (!zieht) {
            if (Math.abs(ddy) > Math.abs(ddx)) { zug = null; return; }
            if (ddx < 6) return;
            zieht = true;
            fenst.classList.add('einst-zieht');
          }
          dx = Math.max(0, ddx);
          inh.style.transform = `translateX(${dx}px)`;
          nv.style.transform = `translateX(calc(-30% + ${dx * 0.3}px))`;
        });
        const ende = (): void => {
          const z = zug;
          zug = null;
          if (!z || !zieht) return;
          const weit = dx > inh.clientWidth / 2;
          const schnell = dx > 40 && dx / Math.max(1, performance.now() - z.t) > 0.5;
          fenst.classList.remove('einst-zieht');
          inh.style.transform = '';
          nv.style.transform = '';
          blick(weit || schnell ? 'liste' : 'bereich');
        };
        inh.addEventListener('pointerup', ende);
        inh.addEventListener('pointercancel', ende);
      };
      wischen(fenster, eiEl, navEl);
    }

    o.addEventListener('click', e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { schliesse(); return; }
      /* Zurück zur Liste. Am Rechner kommt man hier nie hin — der Knopf
         steht dort auf `display:none`. */
      if (elVon(e)?.closest<HTMLElement>('[data-a="liste"]')) {
        blick('liste');
        return;
      }
      const b = elVon(e)?.closest<HTMLElement>('.einst-nav button[data-b]');
      if (b) {
        offenerBereich = b.dataset.b ?? offenerBereich;
        zeichne();
        /* Am Telefon eine Seite weiter; am Rechner ändert die Angabe
           nichts, weil dort beide Spalten stehen. */
        if (amTelefon()) blick('bereich');
        const inh = o.querySelector<HTMLElement>('#ei');
        if (inh) inh.scrollTop = 0;
      }
    });

    /* Wurde das Fenster mit einem Bereich aufgerufen — etwa aus dem
       R-Blatt heraus —, dann ist die Liste nicht gemeint. */
    if (bereich && amTelefon()) fenster?.setAttribute('data-blick', 'bereich');
    /* Den `inert`-Zustand erst NACH dem gewählten Blick setzen (E812, Zusatz). */
    blick(fenster?.getAttribute('data-blick') === 'bereich' ? 'bereich' : 'liste');

    /* Escape geht eine Stufe zurück, nicht gleich ganz hinaus. Wer in
       „Sicherheit" steht und abbrechen will, meint meistens diesen
       Bereich und nicht das ganze Fenster. */
    const beiTaste = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (amTelefon() && fenster?.getAttribute('data-blick') === 'bereich') {
        e.stopPropagation();
        blick('liste');
        return;
      }
      document.removeEventListener('keydown', beiTaste, true);
    };
    document.addEventListener('keydown', beiTaste, true);
    /* Der Rundgang ruft das Fenster von aussen zum Neuzeichnen auf. Ein
       eigenes Feld an einem `div` gibt es im Typ nicht — hier ausdrücklich. */
    (o as HTMLElement & { neuZeichnen?: () => void }).neuZeichnen = zeichne;
  };

  /* --- Bausteine ---------------------------------------------------------- */
  const zeile = (titel: string, beschreibung: any, steuerung: any) =>
    `<div class="ez-zeile"><div class="ez-text"><b>${titel}</b>` +
    (beschreibung ? `<span>${beschreibung}</span>` : '') + '</div>' +
    `<div class="ez-steuer">${steuerung}</div></div>`;

  const wahl = (schluessel: string, werte: any, jetzt: any) =>
    `<select data-set="${schluessel}">` +
    werte.map((w: any) => {
      const [wert, name] = Array.isArray(w) ? w : [w, w];
      return `<option value="${esc(wert)}"${wert === jetzt ? ' selected' : ''}>${esc(name)}</option>`;
    }).join('') + '</select>';

  /* EIN KIPPSCHALTER SAGT, WAS ER IST UND WIE ER STEHT.
     Vorher war er ein <button> ohne Text, ohne Marke und ohne Zustand: ein
     Vorleseprogramm las „Schaltfläche" und sonst nichts, und ob er an war,
     stand allein in seiner Farbe — genau das, was §38 verbietet. */
  const schalter = (schluessel: string, an: any, name = '') =>
    `<button class="schalter${an ? ' an' : ''}" data-toggle="${esc(schluessel)}" ` +
    `role="switch" aria-checked="${an ? 'true' : 'false'}"` +
    (name ? ` aria-label="${esc(name)}"` : '') + `><i></i></button>`;

  const knopf = (aktion: any, text: string, klasse = '') =>
    `<button class="ez-knopf ${klasse}" data-tun="${aktion}">${text}</button>`;

  /* EIN KNOPF, DER SEINEN VERLAUF ZEIGT (E441). Die Seite wird als Text
     gezeichnet; ein Zustandsknopf ist aber ein Element mit Zustand. Deshalb
     steht hier nur ein Platzhalter, und `binde()` tauscht ihn gegen den
     echten Knopf aus `zustandsknopf.ts`. `data-zk` bleibt am fertigen
     Knopf stehen, damit ein Prüflauf ihn findet. */
  const zustandsknopf = (id: string) => `<span data-zk="${esc(id)}"></span>`;

  /**
   * Die Aufträge der Zustandsknöpfe dieser Seite. Der Zustand kommt aus
   * der Zusage der echten Arbeit — nie aus einem Zeitgeber.
   *
   * Die Sicherung endet bei „Heruntergeladen": eine `.redion` oder `.json`
   * kann der Browser nicht öffnen, also gibt es kein „Öffnen". Die
   * HTML-Einzeldatei dagegen kann er — sie bekommt den Öffnen-Weg.
   */
  const zustandsknopfAuftrag = (id: string): ZustandsknopfAuftrag | null => {
    if (id === 'export-json') return {
      art: 'laden', klasse: 'ez-knopf',
      texte: { bereit: 'Speichern', arbeitet: 'Wird erstellt …',
               fertig: 'Heruntergeladen', fehler: 'Nicht gesichert' },
      /* `sicherungSpeichern` fängt seine Fehler selbst und sagt `false`
         (E146); der Knopf wertet genau das als Fehlschlag. */
      aktion: () => App.sicherungSpeichern()
    };
    if (id === 'einzeldatei') {
      let blob: Blob | null = null;
      return {
        art: 'laden', klasse: 'ez-knopf',
        texte: { bereit: 'Erzeugen', arbeitet: 'Wird erzeugt …',
                 geschafft: 'Heruntergeladen', fertig: 'Öffnen' },
        aktion: () => { blob = Werkzeuge.einzelDatei() as Blob; },
        /* Die Adresse wird nicht zurückgegeben: das Fenster braucht sie,
           solange es offen ist, und der Browser räumt sie mit der Seite
           auf. */
        oeffnen: () => { if (blob) window.open(URL.createObjectURL(blob), '_blank'); }
      };
    }
    return null;
  };

  const feld = (schluessel: string, wert: any, platzhalter = '') =>
    `<input data-set="${schluessel}" value="${esc(wert)}" placeholder="${esc(platzhalter)}">`;

  const kopf = (titel: string, unter?: any) =>
    `<h2>${titel}</h2>` + (unter ? `<p class="ez-unter">${unter}</p>` : '');

  /* ========================================================================
   * DIE EINZELNEN BEREICHE
   * ======================================================================*/
  const bindeRedApps = (ziel: HTMLElement): void => {
    const app = ziel.querySelector<HTMLSelectElement>('[data-red-app]');
    const challenge = ziel.querySelector<HTMLInputElement>('[data-red-challenge]');
    const list = ziel.querySelector<HTMLElement>('[data-red-apps]');
    const result = ziel.querySelector<HTMLElement>('[data-red-result]');
    const code = ziel.querySelector<HTMLElement>('[data-red-code]');
    if (!app || !challenge || !list || !result || !code) return;
    let busy = false;
    let clearCode: ReturnType<typeof setTimeout> | undefined;
    const batchField = ziel.querySelector<HTMLTextAreaElement>('[data-red-batch-input]');
    const batchPreview = ziel.querySelector<HTMLElement>('[data-red-batch-preview]');
    const batchButton = ziel.querySelector<HTMLButtonElement>('[data-red-batch-approve]');
    let reviewedBatch: {raw:string;origin:string;token:string;requests:{app:string;challenge:string}[]}|null = null;
    const clearBatch = () => { reviewedBatch = null; batchPreview?.replaceChildren(); if (batchButton) batchButton.disabled = true; };
    const clear = () => { if (clearCode !== undefined) clearTimeout(clearCode); code.textContent = ''; };
    const request = async (path: string, payload?: object) => {
      const w = typeof Wolke === 'undefined' ? null : Wolke;
      const origin = w?.adresse(), token = w?.token();
      if (!origin || !token || !w?.serverAdressePruefen(origin)) throw new Error('Kein angemeldeter HTTPS-Server');
      const response = await fetch(origin + '/red-id/v2/' + path, {
        method: payload ? 'POST' : 'GET', headers: { Authorization: 'Bearer ' + token, ...(payload ? { 'Content-Type': 'application/json' } : {}) },
        ...(payload ? { body: JSON.stringify(payload) } : {}), credentials: 'omit', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(8000)
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    };
    const run = async (action: () => Promise<void>) => {
      if (busy) return;
      busy = true; clear(); result.textContent = 'Anfrage läuft …';
      try { await action(); } catch { result.textContent = 'Anfrage fehlgeschlagen. Prüfe die Anmeldung und Serverversion.'; }
      finally { busy = false; }
    };
    batchField?.addEventListener('input', clearBatch);
    ziel.querySelector('[data-red-batch-review]')?.addEventListener('click', () => {
      if (busy || !batchField || !batchPreview || !batchButton) return;
      clearBatch();
      try {
        const raw = batchField.value;
        if (raw.length > 3000) throw Error('Anfrage zu lang');
        const lines = raw.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        if (!lines.length || lines.length > 11) throw Error('Ungültige Anzahl');
        const apps = new Set<string>(), challenges = new Set<string>();
        const requests = lines.map(line => {
          if (line.length > 256) throw Error('Ungültige Anfrage');
          const d = JSON.parse(line);
          if (!d || typeof d !== 'object' || Array.isArray(d) || Object.keys(d).length !== 4 || d.kind !== 'red-pair' || d.version !== 1 || !Array.from(app.options).some(o => o.value === d.app) || typeof d.challenge !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(d.challenge) || apps.has(d.app) || challenges.has(d.challenge)) throw Error('Ungültige oder doppelte Anfrage');
          apps.add(d.app); challenges.add(d.challenge);
          return {app: String(d.app), challenge: String(d.challenge)};
        });
        const w = typeof Wolke === 'undefined' ? null : Wolke;
        const origin = w?.adresse(), token = w?.token();
        if (!origin || !token || !w?.serverAdressePruefen(origin)) throw Error('Kein angemeldeter HTTPS-Server');
        for (const entry of requests) {
          const li = document.createElement('li'); li.textContent = entry.app.toUpperCase() + ' · ' + entry.challenge; batchPreview.append(li);
        }
        reviewedBatch = {raw,origin,token,requests}; batchButton.disabled = false;
        result.textContent = requests.length + ' Anfragen geprüft. App und vollständige Challenge auf jedem eigenen Zielgerät vergleichen.';
      } catch { clearBatch(); result.textContent = 'Ungültige oder doppelte Kopplungsanfragen oder fehlende Serveranmeldung.'; }
    });
    batchButton?.addEventListener('click', () => {
      if (busy || !reviewedBatch || !batchField || !batchButton) return;
      const selected = reviewedBatch;
      const w = typeof Wolke === 'undefined' ? null : Wolke;
      if (batchField.value !== selected.raw || w?.adresse() !== selected.origin || w?.token() !== selected.token) { clearBatch(); result.textContent = 'Anfragen oder Anmeldung geändert. Erneut prüfen.'; return; }
      if (!window.confirm(selected.requests.map(r => r.app.toUpperCase() + ' · ' + r.challenge).join('\n') + '\n\nAlle ' + selected.requests.length + ' Anmeldungen für 5 Minuten freigeben? Nur eigene Zielgeräte bestätigen.')) return;
      clearBatch();
      void run(async () => {
        if (w?.adresse() !== selected.origin || w?.token() !== selected.token) throw Error('Anmeldung geändert');
        const data = await request('approve-batch', {requests:selected.requests});
        if (data?.version !== 2 || !Array.isArray(data.apps) || data.apps.length !== selected.requests.length || !selected.requests.every((r,i) => data.apps[i] === r.app) || typeof data.expiresAt !== 'string' || !Number.isFinite(Date.parse(data.expiresAt))) throw Error('Ungültige Antwort');
        if (batchField.value === selected.raw) batchField.value = '';
        result.textContent = selected.requests.length + ' Anmeldungen freigegeben. Jede Ziel-App separat abschliessen. Keine gemeinsame Sitzung.';
      });
    });
    ziel.querySelector('[data-red-list]')?.addEventListener('click', () => void run(async () => {
      list.replaceChildren();
      const data = await request('apps');
      if (data.version !== 2 || !Array.isArray(data.apps)) throw new Error('Ungültige Antwort');
      for (const entry of data.apps) {
        if (typeof entry.app !== 'string' || !Number.isSafeInteger(entry.v1Credentials) || !Number.isSafeInteger(entry.v2Sessions)) continue;
        const li = document.createElement('li');
        li.textContent = entry.app.toUpperCase() + ': ' + (entry.v1Credentials + entry.v2Sessions) + ' Zugänge' + (entry.pendingPair ? ' · Kopplung offen' : '');
        list.append(li);
      }
      result.textContent = 'App-Zugänge aktualisiert.';
    }));
    ziel.querySelector('[data-red-import]')?.addEventListener('click', () => {
      const field = ziel.querySelector<HTMLInputElement>('[data-red-request]');
      if (!field) return;
      try {
        const raw = field.value.trim();
        if (raw.length > 256) throw new Error('Ungültige Anfrage');
        const d = JSON.parse(raw);
        if (d?.kind !== 'red-pair' || d.version !== 1 || !Array.from(app.options).some(o => o.value === d.app) || typeof d.challenge !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(d.challenge)) throw new Error('Ungültige Anfrage');
        app.value = d.app; challenge.value = d.challenge; field.value = '';
        result.textContent = 'Anfrage übernommen. Vergleiche App und Challenge mit dem Zielgerät, bevor du freigibst.';
      } catch { result.textContent = 'Ungültige Kopplungsanfrage.'; }
    });
    ziel.querySelector('[data-red-approve]')?.addEventListener('click', () => {
      const selected = app.value, proof = challenge.value.trim();
      if (!/^[A-Za-z0-9_-]{43}$/.test(proof)) { result.textContent = 'Gültige Challenge erforderlich.'; return; }
      if (!window.confirm('Anmeldung für ' + selected.toUpperCase() + ' mit Challenge ' + proof + ' freigeben? Nur bei Übereinstimmung mit dem eigenen Zielgerät bestätigen.')) return;
      void run(async () => {
        await request('approve-login', { app: selected, challenge: proof });
        challenge.value = '';
        result.textContent = '5 Minuten freigegeben. Anmeldung auf dem Zielgerät abschliessen.';
      });
    });
    ziel.querySelector('[data-red-pair]')?.addEventListener('click', () => {
      const selected = app.value, proof = challenge.value.trim();
      if (!/^[A-Za-z0-9_-]{43}$/.test(proof)) { result.textContent = 'Die Ziel-App muss zuerst eine gültige SHA-256-Challenge erzeugen.'; return; }
      void run(async () => {
        const data = await request('pair', { app: selected, challenge: proof });
        if (data.app !== selected || !/^redpair_[a-f0-9]{64}$/.test(data.code)) throw new Error('Ungültige Antwort');
        if (app.value === selected && challenge.value.trim() === proof) challenge.value = '';
        code.textContent = data.code;
        clearCode = setTimeout(clear, 300000);
        result.textContent = selected.toUpperCase() + ' · Einmalcode · 5 Minuten gültig. Nur in die Ziel-App übertragen; nicht teilen.';
      });
    });
    ziel.querySelector('[data-red-revoke]')?.addEventListener('click', () => {
      const selected = app.value;
      if (!window.confirm('Alle RED-ID-Zugänge für ' + selected.toUpperCase() + ' widerrufen?')) return;
      void run(async () => {
        await request('revoke', { app: selected });
        result.textContent = 'App-Zugänge widerrufen. Liste erneut abrufen.';
        list.replaceChildren();
      });
    });
  };

  const bindeRedShare = (ziel: HTMLElement): void => {
    const source = ziel.querySelector<HTMLSelectElement>('[data-share-source]');
    const target = ziel.querySelector<HTMLSelectElement>('[data-share-target]');
    const channel = ziel.querySelector<HTMLInputElement>('[data-share-channel]');
    const list = ziel.querySelector<HTMLElement>('[data-share-items]');
    const status = ziel.querySelector<HTMLElement>('[data-share-status]');
    if (!source || !target || !channel || !list || !status) return;
    let busy = false;
    const request = async (path: string, payload?: object) => {
      const w = typeof Wolke === 'undefined' ? null : Wolke;
      const origin = w?.adresse(), token = w?.token();
      if (!origin || !token || !w?.serverAdressePruefen(origin)) throw new Error('Kein angemeldeter HTTPS-Server');
      const r = await fetch(origin + '/red-share/v1/' + path, {
        method: payload ? 'POST' : 'GET', headers: { Authorization: 'Bearer ' + token, ...(payload ? { 'Content-Type': 'application/json' } : {}) },
        ...(payload ? { body: JSON.stringify(payload) } : {}), credentials: 'omit', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(8000)
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    };
    const refresh = async () => {
      const data = await request('grants');
      if (data?.version !== 1 || !Array.isArray(data.grants)) throw new Error('Ungültige Antwort');
      list.replaceChildren();
      for (const g of data.grants) {
        if (typeof g.source !== 'string' || typeof g.target !== 'string' || typeof g.channel !== 'string' || !Number.isFinite(g.expires)) continue;
        const li = document.createElement('li'), button = document.createElement('button');
        button.className = 'ez-knopf'; button.textContent = g.source.toUpperCase() + ' → ' + g.target.toUpperCase() + ' · ' + g.channel + ' · bis ' + new Date(g.expires).toLocaleDateString('de-CH');
        button.addEventListener('click', () => { source.value = g.source; target.value = g.target; channel.value = g.channel; });
        li.append(button); list.append(li);
      }
      status.textContent = data.grants.length ? 'Freigaben aktualisiert.' : 'Keine aktiven Freigaben.';
    };
    const run = async (fn: () => Promise<void>) => {
      if (busy) return; busy = true; status.textContent = 'Anfrage läuft …';
      try { await fn(); } catch { status.textContent = 'Anfrage fehlgeschlagen. Anmeldung und Server prüfen.'; }
      finally { busy = false; }
    };
    ziel.querySelector('[data-share-list]')?.addEventListener('click', () => void run(refresh));
    const change = (revoke: boolean) => {
      const payload = { source: source.value, target: target.value, channel: channel.value.trim() };
      if (!payload.source || !payload.target || payload.source === payload.target || !/^[a-z][a-z0-9_-]{0,31}$/.test(payload.channel)) { status.textContent = 'Zwei verschiedene Apps und gültigen Kanal wählen.'; return; }
      if (!window.confirm(payload.source.toUpperCase() + ' → ' + payload.target.toUpperCase() + ' · ' + payload.channel + (revoke ? ': Freigabe widerrufen und wartende Nachrichten löschen?' : ': Datenkanal 7 Tage freigeben?'))) return;
      void run(async () => { await request(revoke ? 'revoke' : 'grant', payload); await refresh(); });
    };
    ziel.querySelector('[data-share-grant]')?.addEventListener('click', () => change(false));
    ziel.querySelector('[data-share-revoke]')?.addEventListener('click', () => change(true));
  };

  const bindeRedStore = (ziel: HTMLElement): void => {
    const app = ziel.querySelector<HTMLSelectElement>('[data-store-app]');
    const kind = ziel.querySelector<HTMLSelectElement>('[data-store-kind]');
    const list = ziel.querySelector<HTMLElement>('[data-store-items]');
    const status = ziel.querySelector<HTMLElement>('[data-store-status]');
    if (!app || !kind || !list || !status) return;
    let busy = false;
    const buttons = Array.from(ziel.querySelectorAll<HTMLButtonElement>('[data-store-list], [data-store-grant], [data-store-revoke]'));
    const request = async (path: string, payload?: object) => {
      const w = typeof Wolke === 'undefined' ? null : Wolke;
      const origin = w?.adresse(), token = w?.token();
      if (!origin || !token || !w?.serverAdressePruefen(origin)) throw new Error('Kein angemeldeter HTTPS-Server');
      const response = await fetch(origin + '/red-store/v1/' + path, {
        method: payload ? 'POST' : 'GET', headers: { Authorization: 'Bearer ' + token, ...(payload ? { 'Content-Type': 'application/json' } : {}) },
        ...(payload ? { body: JSON.stringify(payload) } : {}), credentials: 'omit', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(8000)
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    };
    const refresh = async () => {
      const data = await request('grants');
      if (data?.version !== 1 || !Array.isArray(data.apps)) throw new Error('Ungültige Antwort');
      list.replaceChildren();
      for (const entry of data.apps) {
        if (typeof entry.app !== 'string' || !Array.from(app.options).some(o => o.value === entry.app) || !Array.isArray(entry.grants) || !Array.isArray(entry.usage)) continue;
        const li = document.createElement('li');
        const label = document.createElement('strong');
        label.textContent = entry.app.toUpperCase();
        li.append(label);
        for (const type of ['sync', 'file']) {
          const grant = entry.grants.find((g: any) => g.kind === type && Number.isFinite(g.expires));
          const usage = entry.usage.find((u: any) => u.kind === type);
          const row = document.createElement('p');
          const records = Number.isSafeInteger(usage?.records) ? usage.records : 0;
          const bytes = Number.isSafeInteger(usage?.encodedBytes) ? usage.encodedBytes : 0;
          const tombstones = Number.isSafeInteger(usage?.tombstones) ? usage.tombstones : 0;
          row.textContent = (type === 'sync' ? 'Sync' : 'Dateien') + ': ' + records + ' Objekte (' + tombstones + ' gelöscht), ' + Math.round(bytes / 1024) + ' KiB kodiert · ' + (grant ? 'Freigegeben bis ' + new Date(grant.expires).toLocaleDateString('de-CH') : 'Nicht freigegeben');
          li.append(row);
        }
        list.append(li);
      }
      status.textContent = 'Speicherübersicht aktualisiert.';
    };
    const run = async (fn: () => Promise<void>) => {
      if (busy) return;
      busy = true; app.disabled = true; kind.disabled = true; buttons.forEach(b => b.disabled = true);
      status.textContent = 'Anfrage läuft …';
      try { await fn(); } catch { status.textContent = 'Anfrage fehlgeschlagen. Anmeldung und Server prüfen.'; }
      finally { busy = false; app.disabled = false; kind.disabled = false; buttons.forEach(b => b.disabled = false); }
    };
    const change = (revoke: boolean) => {
      if (busy) return;
      const payload = { app: app.value, kind: kind.value };
      if (payload.kind !== 'sync' && payload.kind !== 'file') return;
      const label = payload.app.toUpperCase() + ' · ' + (payload.kind === 'sync' ? 'Sync' : 'Dateien');
      if (!window.confirm(label + (revoke ? ': Zugriff widerrufen? Gespeicherte Objekte bleiben erhalten.' : ': Zugriff für alle angemeldeten Geräte dieser App für 7 Tage freigeben?'))) return;
      void run(async () => { await request(revoke ? 'revoke' : 'grant', payload); await refresh(); });
    };
    ziel.querySelector('[data-store-list]')?.addEventListener('click', () => void run(refresh));
    ziel.querySelector('[data-store-grant]')?.addEventListener('click', () => change(false));
    ziel.querySelector('[data-store-revoke]')?.addEventListener('click', () => change(true));
  };

  const bindeRedSessions = (ziel: HTMLElement): void => {
    const refreshButton = ziel.querySelector<HTMLButtonElement>('[data-red-sessions-refresh]');
    const list = ziel.querySelector<HTMLElement>('[data-red-sessions]');
    const status = ziel.querySelector<HTMLElement>('[data-red-sessions-status]');
    if (!refreshButton || !list || !status) return;
    let busy = false;
    const request = async (path: string, payload?: object) => {
      const w = typeof Wolke === 'undefined' ? null : Wolke;
      const origin = w?.adresse(), token = w?.token();
      if (!origin || !token || !w?.serverAdressePruefen(origin)) throw new Error('Kein angemeldeter HTTPS-Server');
      const response = await fetch(origin + '/red-id/v2/' + path, {
        method: payload ? 'POST' : 'GET', headers: { Authorization: 'Bearer ' + token, ...(payload ? { 'Content-Type': 'application/json' } : {}) },
        ...(payload ? { body: JSON.stringify(payload) } : {}), credentials: 'omit', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(8000)
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    };
    const refresh = async () => {
      const data = await request('sessions');
      if (data?.version !== 1 || !Array.isArray(data.sessions)) throw new Error('Ungültige Antwort');
      list.replaceChildren();
      for (const session of data.sessions) {
        if (typeof session.id !== 'string' || !/^session_[a-f0-9]{64}$/.test(session.id) || typeof session.app !== 'string' || !Number.isFinite(Date.parse(session.createdAt)) || !Number.isFinite(Date.parse(session.refreshExpiresAt))) continue;
        const li = document.createElement('li'), label = document.createElement('p'), button = document.createElement('button');
        label.textContent = session.app.toUpperCase() + ' · ' + session.id.slice(-8) + ' · gekoppelt ' + new Date(session.createdAt).toLocaleString('de-CH') + ' · gültig bis ' + new Date(session.refreshExpiresAt).toLocaleString('de-CH');
        button.className = 'ez-knopf'; button.textContent = 'Nur diese Sitzung widerrufen';
        const id = session.id, app = session.app;
        button.addEventListener('click', () => {
          if (busy || !window.confirm(app.toUpperCase() + ' · ' + id.slice(-8) + ': Nur diese Anmeldung widerrufen? Andere App-Sitzungen und gespeicherte Daten bleiben erhalten.')) return;
          void run(async () => { await request('revoke-session', { id }); await refresh(); });
        });
        li.append(label, button); list.append(li);
      }
      status.textContent = data.truncated ? 'Weitere Sitzungen vorhanden. Anzeige begrenzt.' : data.sessions.length + ' autorisierte App-Sitzungen. Kein Online-Status.';
    };
    const run = async (fn: () => Promise<void>) => {
      if (busy) return;
      busy = true; refreshButton.disabled = true; status.textContent = 'Anfrage läuft …';
      list.querySelectorAll('button').forEach(b => b.disabled = true);
      try { await fn(); } catch { status.textContent = 'Anfrage fehlgeschlagen. Anmeldung und Server prüfen.'; }
      finally { busy = false; refreshButton.disabled = false; list.querySelectorAll('button').forEach(b => b.disabled = false); }
    };
    refreshButton.addEventListener('click', () => void run(refresh));
  };

  const bindeRedAppCenter = (ziel: HTMLElement): void => {
    const button = ziel.querySelector<HTMLButtonElement>('[data-app-center-refresh]');
    const list = ziel.querySelector<HTMLElement>('[data-app-center-list]');
    const status = ziel.querySelector<HTMLElement>('[data-app-center-status]');
    if (!button || !list || !status) return;
    button.addEventListener('click', async () => {
      const w = typeof Wolke === 'undefined' ? null : Wolke;
      const origin = w?.adresse(), token = w?.token();
      if (!origin || !token || !w?.serverAdressePruefen(origin)) { status.textContent = 'Kein angemeldeter HTTPS-Server.'; return; }
      button.disabled = true; status.textContent = 'App-Übersicht wird geladen …'; list.replaceChildren();
      try {
        const response = await fetch(origin + '/home/apps', { headers: { Authorization: 'Bearer ' + token }, credentials: 'omit', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(8000) });
        if (!response.ok) throw Error('HTTP ' + response.status);
        const data = await response.json();
        if (data?.version !== 1 || !Array.isArray(data.apps) || data.apps.length !== 11) throw Error('Ungültige App-Übersicht');
        const fragment = document.createDocumentFragment();
        const number = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? String(v) : '–';
        for (const app of data.apps) {
          if (typeof app.name !== 'string' || typeof app.category !== 'string' || typeof app.integration !== 'string' || typeof app.connected !== 'boolean' || !Array.isArray(app.grants) || !app.share || !app.storage) throw Error('Ungültiger App-Eintrag');
          const row = document.createElement('li'), name = document.createElement('strong'), detail = document.createElement('p'), access = document.createElement('p');
          name.textContent = app.name + ' · ' + app.category;
          detail.textContent = (app.connected ? 'Autorisierte Zugänge vorhanden' : 'Keine autorisierten Zugänge') + ' · ' + number(app.sessions) + ' Sitzungen · ' + (app.integration === 'home-server' ? 'Home Server' : 'Integrationspilot');
          const sync = app.grants.some((g: any) => g?.kind === 'sync'), file = app.grants.some((g: any) => g?.kind === 'file');
          access.textContent = 'Sync ' + (sync ? 'freigegeben' : 'gesperrt') + ' · Dateien ' + (file ? 'freigegeben' : 'gesperrt') + ' · Share ' + number(app.share.incoming) + ' eingehend / ' + number(app.share.outgoing) + ' ausgehend · ' + number(app.storage.objects) + ' Objekte';
          row.append(name, detail, access); fragment.append(row);
        }
        list.replaceChildren(fragment);
        status.textContent = '11 App-Kennungen · Zugänge, keine Installations- oder Online-Erkennung.';
      } catch { status.textContent = 'App-Übersicht nicht verfügbar. Anmeldung und Serverversion prüfen.'; }
      finally { button.disabled = false; }
    });
  };

  const bindeRedReminders = (ziel: HTMLElement): void => {
    const list = ziel.querySelector<HTMLElement>('[data-reminder-list]');
    const status = ziel.querySelector<HTMLElement>('[data-reminder-status]');
    const kind = ziel.querySelector<HTMLSelectElement>('[data-reminder-kind]');
    const period = ziel.querySelector<HTMLSelectElement>('[data-reminder-period]');
    const date = ziel.querySelector<HTMLInputElement>('[data-reminder-date]');
    const refreshButton = ziel.querySelector<HTMLButtonElement>('[data-reminder-refresh]');
    const createButton = ziel.querySelector<HTMLButtonElement>('[data-reminder-create]');
    const historyButton = ziel.querySelector<HTMLButtonElement>('[data-reminder-history-refresh]');
    const historyList = ziel.querySelector<HTMLElement>('[data-reminder-history-list]');
    const historyStatus = ziel.querySelector<HTMLElement>('[data-reminder-history-status]');
    if (!list || !status || !kind || !period || !date || !refreshButton || !createButton || !historyButton || !historyList || !historyStatus) return;
    const labels: Record<string,string> = { 'backup-review': 'Backup prüfen', 'grant-review': 'Freigaben prüfen', 'storage-review': 'Speicher prüfen', 'update-review': 'Updates prüfen' };
    const periods: Record<string,string> = { once: 'Einmalig', daily: 'Alle 24 Stunden', weekly: 'Alle 7 Tage' };
    let busy = false;
    let pendingCreate: {id:string;kind:string;period:string;firstDue:number}|null = null;
    const request = async (action: string, payload?: object) => {
      const w = typeof Wolke === 'undefined' ? null : Wolke;
      const origin = w?.adresse(), token = w?.token();
      if (!origin || !token || !w?.serverAdressePruefen(origin)) throw Error('Kein angemeldeter HTTPS-Server');
      const response = await fetch(origin + '/home/reminders/' + action, {
        method: payload ? 'POST' : 'GET', headers: { Authorization: 'Bearer ' + token, ...(payload ? { 'Content-Type': 'application/json' } : {}) },
        ...(payload ? { body: JSON.stringify(payload) } : {}), credentials: 'omit', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(8000)
      });
      if (!response.ok) throw Error('HTTP ' + response.status);
      return response.json();
    };
    const format = (v: number) => new Date(v).toLocaleString('de-CH');
    const validTime = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 && v <= 8640000000000000;
    const resultLabels: Record<string,string> = {ok:'Normal',warning:'Warnung',critical:'Kritisch',unknown:'Unbekannt'};
    const reviewText = (v: unknown, k: string): string => {
      if (!v || typeof v !== 'object') return 'Noch kein Prüfergebnis';
      const r = v as {status?:unknown; measuredAt?:unknown; result?:{availablePercent?:unknown; store?:{expiringSoon?:unknown}; share?:{expiringSoon?:unknown}; credentials?:{expiringSoon?:unknown}}};
      if (typeof r.status !== 'string' || !Object.hasOwn(resultLabels,r.status) || !validTime(r.measuredAt)) return 'Prüfergebnis nicht verfügbar';
      let text = resultLabels[r.status] + ' · ' + format(r.measuredAt);
      if (k === 'storage-review' && typeof r.result?.availablePercent === 'number' && Number.isFinite(r.result.availablePercent) && r.result.availablePercent >= 0 && r.result.availablePercent <= 100) text += ' · ' + r.result.availablePercent.toFixed(1) + ' % frei';
      if (k === 'grant-review') {
        const counts = [r.result?.store?.expiringSoon,r.result?.share?.expiringSoon,r.result?.credentials?.expiringSoon];
        if (counts.every(n => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0)) text += ' · ' + counts.reduce<number>((sum,n) => sum + Number(n),0) + ' laufen in 24 h aus';
      }
      return text;
    };
    const refreshHistory = async () => {
      historyList.replaceChildren(); historyStatus.textContent = 'Historie wird abgerufen …';
      try {
        const data = await request('history');
        if (data?.version !== 1 || !Array.isArray(data.entries) || data.entries.length > 64 || typeof data.truncated !== 'boolean') throw Error('Ungültige Historie');
        const fragment = document.createDocumentFragment();
        for (const entry of data.entries) {
          if (!entry || !['storage-review','grant-review'].includes(entry.kind) || !validTime(entry.due) || !validTime(entry.measuredAt)) throw Error('Ungültiger Eintrag');
          const li = document.createElement('li'); li.textContent = labels[entry.kind] + ' · ' + reviewText(entry,entry.kind); fragment.append(li);
        }
        historyList.replaceChildren(fragment);
        historyStatus.textContent = data.entries.length ? data.entries.length + ' neueste Prüfungen' + (data.truncated ? ' · weitere ältere Einträge vorhanden' : '') : 'Noch keine gespeicherten Prüfungen.';
        status.textContent = 'Historie abgerufen.';
      } catch { historyStatus.textContent = 'Historie nicht verfügbar. Serverversion und Anmeldung prüfen.'; status.textContent = 'Historie nicht verfügbar.'; }
    };
    const refresh = async () => {
      const data = await request('poll', {});
      if (data?.version !== 1 || !Array.isArray(data.rules) || data.rules.length > 64) throw Error('Ungültige Antwort');
      const fragment = document.createDocumentFragment();
      let due = 0;
      for (const rule of data.rules) {
        if (typeof rule.id !== 'string' || !/^[a-f0-9]{32}$/.test(rule.id) || !Object.hasOwn(labels, rule.kind) || !Object.hasOwn(periods, rule.period) || ![rule.nextDue, rule.pendingDue].every(v => v === null || typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 && v <= 8640000000000000)) throw Error('Ungültige Regel');
        const row = document.createElement('li'), title = document.createElement('strong'), detail = document.createElement('p');
        title.textContent = labels[rule.kind] + ' · ' + periods[rule.period];
        detail.textContent = (rule.pendingDue !== null ? 'Fällig seit ' + format(rule.pendingDue) + ' · ' : '') + (rule.nextDue !== null ? 'Nächster Termin: ' + format(rule.nextDue) : 'Keine Wiederholung');
        row.append(title, detail);
        if (rule.kind === 'storage-review' || rule.kind === 'grant-review') {
          const result = document.createElement('p'); result.textContent = 'Letzte Prüfung: ' + reviewText(rule.review,rule.kind); row.append(result);
        }
        const id: string = rule.id;
        if (rule.pendingDue !== null) {
          due++;
          const occurrence: number = rule.pendingDue, ack = document.createElement('button');
          ack.className = 'ez-knopf'; ack.textContent = 'Hinweis bestätigen';
          ack.addEventListener('click', () => void run(async () => { await request('ack', { id, due: occurrence }); await refresh(); }));
          row.append(ack);
        }
        const cancel = document.createElement('button');
        cancel.className = 'ez-knopf'; cancel.textContent = 'Termin entfernen';
        cancel.addEventListener('click', () => {
          if (busy || !window.confirm('Wartungstermin, offene Hinweise und zugehörige Prüfhistorie entfernen?')) return;
          if (pendingCreate?.id === id) pendingCreate = null;
          void run(async () => { await request('cancel', { id }); await refresh(); });
        });
        row.append(cancel); fragment.append(row);
      }
      list.replaceChildren(fragment);
      historyList.replaceChildren(); historyStatus.textContent = 'Historie bei Bedarf aktualisieren.';
      status.textContent = due + ' fällige Hinweise · ' + data.rules.length + ' Wartungstermine.';
    };
    const run = async (fn: () => Promise<void>) => {
      if (busy) return;
      busy = true; refreshButton.disabled = true; createButton.disabled = true; historyButton.disabled = true; kind.disabled = true; period.disabled = true; date.disabled = true;
      list.querySelectorAll('button').forEach(b => b.disabled = true);
      status.textContent = 'Anfrage läuft …';
      try { await fn(); } catch { status.textContent = 'Anfrage fehlgeschlagen. Server und Anmeldung prüfen; bei gleichem Termin erneut versuchen.'; }
      finally { busy = false; refreshButton.disabled = false; createButton.disabled = false; historyButton.disabled = false; kind.disabled = false; period.disabled = false; date.disabled = false; list.querySelectorAll('button').forEach(b => b.disabled = false); }
    };
    refreshButton.addEventListener('click', () => void run(refresh));
    historyButton.addEventListener('click', () => void run(refreshHistory));
    createButton.addEventListener('click', () => {
      if (busy) return;
      const firstDue = new Date(date.value).getTime(), k = kind.value, p = period.value;
      if (!Number.isSafeInteger(firstDue) || firstDue < Date.now() - 60000 || firstDue > Date.now() + 366*86400000 || !Object.hasOwn(labels,k) || !Object.hasOwn(periods,p)) { status.textContent = 'Gültigen zukünftigen Termin innerhalb eines Jahres auswählen.'; return; }
      if (!window.confirm(labels[k] + ' · ' + format(firstDue) + ' · ' + periods[p] + '? Speicher und Freigaben werden bei aktiviertem Server-Scheduler nur lesend geprüft. Backup und Updates bleiben Hinweise.')) return;
      const same = pendingCreate && pendingCreate.kind === k && pendingCreate.period === p && pendingCreate.firstDue === firstDue;
      const payload = same && pendingCreate ? pendingCreate : {id: Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2,'0')).join(''),kind:k,period:p,firstDue};
      pendingCreate = payload;
      void run(async () => { await request('create',payload); pendingCreate = null; await refresh(); });
    });
  };

  type HomeIdentity = {origin:string;token:string};
  const homeIdentity = (): HomeIdentity => {
    const w = typeof Wolke === 'undefined' ? null : Wolke;
    const origin = w?.adresse(), token = w?.token();
    if (!origin || !token || !w?.serverAdressePruefen(origin)) throw Error('Kein angemeldeter HTTPS-Server');
    return {origin,token};
  };
  const sameHomeIdentity = (identity: HomeIdentity): boolean => {
    try { const current = homeIdentity(); return current.origin === identity.origin && current.token === identity.token; } catch { return false; }
  };
  const homeRequest = async (identity: HomeIdentity,path: string,payload?: object,signal: AbortSignal = AbortSignal.timeout(8000)) => {
    if (!sameHomeIdentity(identity)) throw Error('Anmeldung geändert');
    const response = await fetch(identity.origin + path, {
      method: payload ? 'POST' : 'GET', headers: {Authorization:'Bearer '+identity.token,...(payload?{'Content-Type':'application/json'}:{})},
      ...(payload?{body:JSON.stringify(payload)}:{}),credentials:'omit',redirect:'error',cache:'no-store',signal
    });
    if (!response.ok) throw Error('HTTP '+response.status);
    const result = await response.json();
    if (!sameHomeIdentity(identity) || signal.aborted) throw Error('Anfrage abgebrochen oder Anmeldung geändert');
    return result;
  };
  const bindeMcpHub = (ziel: HTMLElement): void => {
    const refresh = ziel.querySelector<HTMLButtonElement>('[data-hub-refresh]');
    const list = ziel.querySelector<HTMLElement>('[data-hub-list]');
    const status = ziel.querySelector<HTMLElement>('[data-hub-status]');
    if (!refresh || !list || !status) return;
    let busy = false;
    const scopes: Record<string,string> = {'redion:read':'Lesen','redion:write':'Bearbeiten','redion:images':'Bilder lesen'};
    const load = async (identity: HomeIdentity) => {
      list.replaceChildren();
      const data = await homeRequest(identity,'/home/mcp-hub/connections');
      if (data?.version !== 1 || typeof data.enabled !== 'boolean' || typeof data.truncated !== 'boolean' || !Array.isArray(data.connections) || data.connections.length > 128) throw Error('Ungültige Antwort');
      const fragment = document.createDocumentFragment();
      for (const entry of data.connections) {
        if (!entry || typeof entry.id !== 'string' || !/^grant:[a-f0-9]{64}$/.test(entry.id) || typeof entry.clientName !== 'string' || entry.clientName.length > 120 || !Array.isArray(entry.scopes) || entry.scopes.length > 3 || !entry.scopes.every((scope:unknown) => typeof scope === 'string' && Object.hasOwn(scopes,scope)) || !Number.isSafeInteger(entry.workspaceCount) || entry.workspaceCount < 0 || typeof entry.remember !== 'boolean') throw Error('Ungültige Verbindung');
        const name: string = entry.clientName, id: string = entry.id;
        const li = document.createElement('li'), title = document.createElement('strong'), details = document.createElement('p'), revoke = document.createElement('button');
        title.textContent = name; details.textContent = entry.scopes.map((scope:string) => scopes[scope]).join(' · ') + ' · ' + entry.workspaceCount + ' Arbeitsbereiche' + (entry.remember?' · Freigabe gemerkt':'');
        revoke.className = 'ez-knopf'; revoke.textContent = 'Verbindung widerrufen';
        revoke.addEventListener('click', () => {
          if (busy) return;
          if (!sameHomeIdentity(identity)) { list.replaceChildren(); status.textContent = 'Anmeldung geändert. Verbindungen erneut abrufen.'; return; }
          if (!window.confirm('KI-Verbindung „'+name+'“ widerrufen? Neue Anfragen mit ihren bisherigen Tokens werden gesperrt.')) return;
          void run(async () => { const result = await homeRequest(identity,'/home/mcp-hub/revoke',{id,confirm:true}); if (result?.ok !== true) throw Error('Ungültige Antwort'); await load(identity); });
        });
        li.append(title,details,revoke); fragment.append(li);
      }
      list.replaceChildren(fragment);
      status.textContent = (data.enabled?'MCP aktiviert':'MCP deaktiviert')+' · '+data.connections.length+' aktive Freigaben'+(data.truncated?' · weitere vorhanden':'');
    };
    const run = async (fn: () => Promise<void>) => {
      if (busy) return;
      busy = true; refresh.disabled = true; list.querySelectorAll('button').forEach(b=>b.disabled=true); status.textContent = 'Anfrage läuft …';
      try { await fn(); } catch { list.replaceChildren(); status.textContent = 'Anfrage fehlgeschlagen. Server und Anmeldung prüfen. Nach unklarem Widerruf Liste neu abrufen.'; }
      finally { busy=false; refresh.disabled=false; list.querySelectorAll('button').forEach(b=>b.disabled=false); }
    };
    refresh.addEventListener('click',()=>void run(()=>load(homeIdentity())));
  };
  const bindeLocalAi = (ziel: HTMLElement): void => {
    const load = ziel.querySelector<HTMLButtonElement>('[data-ai-models]');
    const select = ziel.querySelector<HTMLSelectElement>('[data-ai-model]');
    const prompt = ziel.querySelector<HTMLTextAreaElement>('[data-ai-prompt]');
    const generate = ziel.querySelector<HTMLButtonElement>('[data-ai-generate]');
    const cancel = ziel.querySelector<HTMLButtonElement>('[data-ai-cancel]');
    const clear = ziel.querySelector<HTMLButtonElement>('[data-ai-clear]');
    const output = ziel.querySelector<HTMLElement>('[data-ai-output]');
    const status = ziel.querySelector<HTMLElement>('[data-ai-status]');
    if (!load || !select || !prompt || !generate || !cancel || !clear || !output || !status) return;
    let identity: HomeIdentity|null=null, allowed = new Set<string>(), active: AbortController|null=null;
    const resetModels = () => { identity=null; allowed.clear(); select.replaceChildren(); generate.disabled=true; };
    const controls = (busy:boolean) => { load.disabled=busy; select.disabled=busy; prompt.disabled=busy; generate.disabled=busy||!identity||!allowed.size; cancel.disabled=!busy; clear.disabled=busy; };
    const run = async (fn:(controller:AbortController)=>Promise<void>) => {
      if(active)return;
      const controller = new AbortController(); active=controller; controls(true);
      try { await fn(controller); }
      catch { output.textContent=''; status.textContent=controller.signal.aborted?'Anfrage abgebrochen.':'Lokale KI nicht verfügbar. Serverkonfiguration, Modell und Anmeldung prüfen.'; }
      finally { if(active===controller)active=null; if(identity&&!sameHomeIdentity(identity))resetModels(); controls(false); }
    };
    load.addEventListener('click',()=>void run(async controller=>{
      resetModels(); output.textContent=''; status.textContent='Konfigurierte Modelle werden abgerufen …';
      const current=homeIdentity();
      const data=await homeRequest(current,'/home/ai/models',undefined,AbortSignal.any([controller.signal,AbortSignal.timeout(8000)]));
      if(data?.version!==1||data.provider!=='loopback-ollama'||data.installedStatus!==false||!Array.isArray(data.models)||data.models.length>16||!data.models.every((m:unknown)=>typeof m==='string'&&m.length>0&&m.length<=120)||new Set(data.models).size!==data.models.length)throw Error('Ungültige Modellliste');
      for(const name of data.models){const option=document.createElement('option');option.value=name;option.textContent=name;select.append(option);}
      identity=current;allowed=new Set<string>(data.models);status.textContent=allowed.size+' konfigurierte Modelle. Installation und Offline-Betrieb nicht geprüft.';
    }));
    generate.addEventListener('click',()=>{
      if(active||!identity)return;
      if(!sameHomeIdentity(identity)){resetModels();output.textContent='';status.textContent='Anmeldung geändert. Modelle erneut abrufen.';return;}
      const current=identity,model=select.value,text=prompt.value;
      if(!allowed.has(model)||!text.trim()||new TextEncoder().encode(text).byteLength>16384){status.textContent='Modell und Eingabe prüfen (max. 16 KiB UTF-8).';return;}
      if(!window.confirm('Eingabe an das konfigurierte Ollama-Modell „'+model+'“ auf deinem Home-Server senden? Der Serverbetreiber muss den Offline-Betrieb sicherstellen.'))return;
      void run(async controller=>{
        output.textContent='';status.textContent='Antwort wird erzeugt …';
        const data=await homeRequest(current,'/home/ai/generate',{model,prompt:text,confirmLocalProcessing:true},AbortSignal.any([controller.signal,AbortSignal.timeout(65000)]));
        if(data?.version!==1||data.model!==model||typeof data.text!=='string'||data.text.length>262144)throw Error('Ungültige Antwort');
        output.textContent=data.text;status.textContent='Antwort erhalten. Nicht automatisch gespeichert.';
      });
    });
    cancel.addEventListener('click',()=>active?.abort());
    clear.addEventListener('click',()=>{if(active)return;prompt.value='';output.textContent='';status.textContent='Eingabe und Ausgabe entfernt.';});
  };

  const bindeHomeServer = (ziel: HTMLElement): void => {
    const button = ziel.querySelector<HTMLButtonElement>('[data-home-refresh]');
    const status = ziel.querySelector<HTMLElement>('[data-home-status]');
    const list = ziel.querySelector<HTMLElement>('[data-home-metrics]');
    if (!button || !status || !list) return;
    button.addEventListener('click', async () => {
      list.replaceChildren();
      const w = typeof Wolke === 'undefined' ? null : Wolke;
      const origin = w?.adresse(), token = w?.token();
      if (!origin || !token || !w?.serverAdressePruefen(origin)) {
        status.textContent = 'Kein angemeldeter HTTPS-Server eingerichtet.';
        return;
      }
      button.disabled = true;
      status.textContent = 'Serverstatus wird abgerufen …';
      try {
        const response = await fetch(origin + '/home/dashboard', { headers: { Authorization: 'Bearer ' + token }, credentials: 'omit', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(8000) });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data = await response.json();
        if (data.version !== 1 || !data.cpu || !data.memory || !data.storage || !data.devices || !data.services) throw new Error('Ungültige Antwort');
        const number = (v: unknown, unit = '') => typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 10) / 10 + unit : 'Nicht verfügbar';
        const gb = (v: unknown) => typeof v === 'number' && Number.isFinite(v) ? number(v / 1e9, ' GB') : 'Nicht verfügbar';
        const rows: [string, string][] = [
          ['CPU', number(data.cpu.percent, ' %')],
          ['RAM', gb(data.memory.usedBytes) + ' / ' + gb(data.memory.totalBytes)],
          ['SSD/Dateisystem verfügbar', gb(data.storage.availableBytes) + ' / ' + gb(data.storage.totalBytes)],
          ['Speicherstatus', data.storageReview?.status === 'ok' ? 'Normal' : data.storageReview?.status === 'warning' ? 'Warnung' : data.storageReview?.status === 'critical' ? 'Kritisch' : 'Unbekannt'],
          ['Freier Speicher', number(data.storageReview?.availablePercent, ' %')],
          ['Sync-/Dateifreigaben laufen in 24 h aus', number(data.grantReview?.store?.expiringSoon)],
          ['Share-Freigaben laufen in 24 h aus', number(data.grantReview?.share?.expiringSoon)],
          ['RED-ID-Zugänge laufen in 24 h aus', number(data.grantReview?.credentials?.expiringSoon)],
          ['Temperatur', number(data.temperatureC, ' °C')],
          ['Serverprozess aktiv seit', number(data.processUptimeSeconds / 60, ' min')],
          ['Autorisierte Gerätesitzungen', number(data.devices.authorizedSessions)],
          ['RED-ID-Zugänge', number(data.redId?.activeCredentials)],
          ['MCP', data.services.mcp === 'enabled' ? 'Aktiviert' : 'Deaktiviert'],
          ['MCP-Freigabeeinträge', number(data.mcp?.grantRecords)],
          ['Anfragen (letzte 60 Minuten)', number(data.monitor?.requests)],
          ['Clientfehler (4xx)', number(data.monitor?.clientErrors)],
          ['Serverfehler (5xx)', number(data.monitor?.serverErrors)],
          ['Mittlere Antwortzeit', number(data.monitor?.meanMs, ' ms')],
          ['Maximale Antwortzeit', number(data.monitor?.maxMs, ' ms')],
          ['Netzwerk empfangen / gesendet', gb(data.network?.receivedBytes) + ' / ' + gb(data.network?.sentBytes)]
        ];
        for (const [label, value] of rows) {
          const dt = document.createElement('dt'), dd = document.createElement('dd');
          dt.textContent = label; dd.textContent = value;
          list.append(dt, dd);
        }
        status.textContent = 'Erreichbar · Sicht des Serverprozesses · ' + new Date().toLocaleTimeString('de-CH');
      } catch {
        status.textContent = 'Serverstatus nicht verfügbar. Anmeldung, HTTPS-Verbindung und Serverversion prüfen.';
      } finally { button.disabled = false; }
    });
  };

  const inhalt = (b: any): string => (({
    'home-server': () => kopf('RED Home Server', 'Private Infrastruktur und Diagnose') + '<div class="ez-karte"><button class="ez-knopf" data-home-refresh>Serverstatus abrufen</button><p data-home-status role="status">Verbinde zuerst dein Gerät mit dem privaten Server.</p><dl data-home-metrics></dl></div><div class="ez-karte"><h3>RED MCP Hub</h3><p>Eigene OAuth-Verbindungen anzeigen und widerrufen. Keine externen MCP-Server oder neuen Werkzeugrechte.</p><button class="ez-knopf" data-hub-refresh>KI-Verbindungen abrufen</button><p data-hub-status role="status"></p><ul data-hub-list style="overflow-wrap:anywhere"></ul></div><div class="ez-karte"><h3>RED AI Gateway</h3><p>Explizite Textgenerierung über konfiguriertes Ollama. Kein automatischer Dokumentzugriff, kein Gesprächsverlauf. Offline-Betrieb durch Serverbetreiber sicherstellen.</p><button class="ez-knopf" data-ai-models>Modelle abrufen</button><label>Modell <select data-ai-model></select></label><label>Eingabe <textarea data-ai-prompt rows="5" maxlength="16384" autocomplete="off" spellcheck="false"></textarea></label><button class="ez-knopf" data-ai-generate disabled>Antwort erzeugen</button><button class="ez-knopf" data-ai-cancel disabled>Abbrechen</button><button class="ez-knopf" data-ai-clear>Eingabe und Antwort leeren</button><p data-ai-status role="status"></p><pre data-ai-output style="white-space:pre-wrap;overflow-wrap:anywhere"></pre></div><div class="ez-karte"><h3>RED App Center</h3><p>Zentrale Übersicht der autorisierten RED-App-Zugänge und Freigaben. Keine Installation oder automatische Aktualisierung.</p><button class="ez-knopf" data-app-center-refresh>Alle 11 Apps anzeigen</button><ul data-app-center-list></ul><p data-app-center-status role="status"></p></div><div class="ez-karte"><h3>RED Notify · Wartungskalender</h3><p>Wartungshinweise beim Abruf oder mit aktiviertem Server-Scheduler. Speicher und Freigaben werden dann nur lesend geprüft; Backup und Updates bleiben Hinweise. Wiederholung als feste UTC-Intervalle, ohne Sommerzeitkorrektur.</p><label>Aufgabe <select data-reminder-kind><option value="backup-review">Backup prüfen</option><option value="grant-review">Freigaben prüfen</option><option value="storage-review">Speicher prüfen</option><option value="update-review">Updates prüfen</option></select></label><label>Erster Termin (Ortszeit) <input type="datetime-local" data-reminder-date></label><label>Wiederholung <select data-reminder-period><option value="once">Einmalig</option><option value="daily">Alle 24 Stunden</option><option value="weekly">Alle 7 Tage</option></select></label><button class="ez-knopf" data-reminder-create>Termin anlegen</button><button class="ez-knopf" data-reminder-refresh>Fällige Hinweise abrufen</button><ul data-reminder-list></ul><p data-reminder-status role="status"></p><h3>Wartungshistorie</h3><button class="ez-knopf" data-reminder-history-refresh>Prüfhistorie abrufen</button><p data-reminder-history-status role="status"></p><ul data-reminder-history-list></ul></div><div class="ez-karte"><h3>RED ID · App-Verbindungen</h3><p>Nur autorisierte Zugänge, keine Aussage über installierte oder online befindliche Apps.</p><button class="ez-knopf" data-red-list>App-Zugänge anzeigen</button><ul data-red-apps></ul><label>RED-App <select data-red-app><option value="red-ion">RED-ION</option><option value="red-fit">RED-FIT</option><option value="red-poly">RED-POLY</option><option value="red-bit">RED-BIT</option><option value="red-loop">RED-LOOP</option><option value="red-efz">RED-EFZ</option><option value="red-kurd">RED-KURD</option><option value="red-uhr">RED-UHR</option><option value="red-yt">RED-YT</option><option value="stran">STRAN</option><option value="babat-red">BABAT-RED</option></select></label><label>Challenge der Ziel-App <input type="text" data-red-challenge autocomplete="off" spellcheck="false" maxlength="43"></label><label>Kopplungsanfrage (JSON aus der Ziel-App) <input data-red-request type="text" maxlength="256" autocomplete="off" spellcheck="false"></label><button class="ez-knopf" data-red-import>Anfrage übernehmen</button><button class="ez-knopf" data-red-approve>Direkte Anmeldung freigeben</button><button class="ez-knopf" data-red-pair>Kopplung freigeben</button><button class="ez-knopf" data-red-revoke>App-Zugänge widerrufen</button><p data-red-result role="status"></p><pre data-red-code style="white-space:pre-wrap;overflow-wrap:anywhere"></pre><h3>RED SSO · Mehrfachfreigabe</h3><p>Bis zu 11 verschiedene Apps. Pro Zeile eine öffentliche Kopplungsanfrage aus dem eigenen Zielgerät. Keine privaten Verifier oder Tokens eingeben. Jede App erhält eine eigene Sitzung.</p><label>Kopplungsanfragen <textarea data-red-batch-input maxlength="3000" rows="5" autocomplete="off" spellcheck="false"></textarea></label><button class="ez-knopf" data-red-batch-review>Alle Anfragen prüfen</button><ul data-red-batch-preview style="overflow-wrap:anywhere"></ul><button class="ez-knopf" data-red-batch-approve disabled>Geprüfte Anmeldungen freigeben</button></div><div class="ez-karte"><h3>RED Devices · App-Sitzungen</h3><p>Einzelne RED-ID-v2-Anmeldungen widerrufen. Es werden keine Gerätepositionen oder Online-Aktivitäten erfasst.</p><button class="ez-knopf" data-red-sessions-refresh>Sitzungen abrufen</button><ul data-red-sessions></ul><p data-red-sessions-status role="status"></p></div><div class="ez-karte"><h3>RED Share · Datenfreigaben</h3><p>Nur ausgewählte Apps und Kanäle. Schlüssel separat auf beiden Geräten bestätigen.</p><button class="ez-knopf" data-share-list>Freigaben abrufen</button><ul data-share-items></ul><label>Sender <select data-share-source><option value="red-ion">RED-ION</option><option value="red-fit">RED-FIT</option><option value="red-poly">RED-POLY</option><option value="red-bit">RED-BIT</option><option value="red-loop">RED-LOOP</option><option value="red-efz">RED-EFZ</option><option value="red-kurd">RED-KURD</option><option value="red-uhr">RED-UHR</option><option value="red-yt">RED-YT</option><option value="stran">STRAN</option><option value="babat-red">BABAT-RED</option></select></label><label>Empfänger <select data-share-target><option value="red-ion">RED-ION</option><option value="red-fit">RED-FIT</option><option value="red-poly">RED-POLY</option><option value="red-bit">RED-BIT</option><option value="red-loop">RED-LOOP</option><option value="red-efz">RED-EFZ</option><option value="red-kurd">RED-KURD</option><option value="red-uhr">RED-UHR</option><option value="red-yt">RED-YT</option><option value="stran">STRAN</option><option value="babat-red">BABAT-RED</option></select></label><label>Kanal <input data-share-channel maxlength="32" autocomplete="off" spellcheck="false" placeholder="workout"></label><button class="ez-knopf" data-share-grant>7 Tage freigeben</button><button class="ez-knopf" data-share-revoke>Freigabe widerrufen</button><p data-share-status role="status"></p></div><div class="ez-karte"><h3>RED Sync &amp; RED Files · Pilot</h3><p>Getrennte verschlüsselte App-Objekte. Keine automatische Freigabe zwischen Apps. Alle Geräte derselben App teilen die Freigabe; der Schlüssel muss separat verwaltet werden.</p><button class="ez-knopf" data-store-list>Speicher und Freigaben anzeigen</button><ul data-store-items></ul><label>RED-App <select data-store-app><option value="red-ion">RED-ION</option><option value="red-fit">RED-FIT</option><option value="red-poly">RED-POLY</option><option value="red-bit">RED-BIT</option><option value="red-loop">RED-LOOP</option><option value="red-efz">RED-EFZ</option><option value="red-kurd">RED-KURD</option><option value="red-uhr">RED-UHR</option><option value="red-yt">RED-YT</option><option value="stran">STRAN</option><option value="babat-red">BABAT-RED</option></select></label><label>Bereich <select data-store-kind><option value="sync">Sync-Daten</option><option value="file">Kleine Dateiobjekte</option></select></label><button class="ez-knopf" data-store-grant>7 Tage freigeben</button><button class="ez-knopf" data-store-revoke>Zugriff widerrufen</button><p data-store-status role="status"></p></div>',
    geraete: () => kopf('iPhone und Windows', 'Geräte, Sicherungen und freiwilliger Abgleich') + DeviceIntegration.overview(),
    /* HIER STAND DAS GEGENTEIL DESSEN, WAS GEBAUT IST (E270).
       „Diese App kennt kein Konto und keinen Server", „es gibt keine
       Anmeldung", „Nichts wird übertragen, es gibt keine Sitzungen" —
       drei Sätze aus der Zeit vor dem Serverbau. Seither gibt es Konten
       (GitHub, Google, Gerätecode), Sitzungen, Abgleich und Freigaben,
       samt Wolke-Fenster. Wer hier nachlas, bekam die Auskunft, es gäbe
       nichts davon.
       Die Seite baut deshalb KEINEN zweiten Dialog (E29), sondern sagt
       die Wahrheit und führt zum vorhandenen. Vier Zustände, weil es
       vier gibt — und die mittleren zwei sind die wichtigsten: angemeldet
       und trotzdem nichts hinausgeschickt (E1/E34), und angemeldet mit
       einer offenen Entscheidung nach einem Einspielen (L76/E279). */
    konto: () => {
      const w = (globalThis as any).Wolke;
      const angemeldet = !!(w && w.angemeldet && w.angemeldet());
      const gleichtAb = angemeldet && !!(w.abgleichErlaubt && w.abgleichErlaubt());
      /* VIER Zustände seit L76 — es waren drei. Steht die Frage nach einem
         eingespielten „Ersetzen", ist `abgleichErlaubt()` falsch, und diese
         Seite behauptete darum „Der Abgleich ist ausgeschaltet". Das hat
         niemand ausgeschaltet: es wartet eine Entscheidung. */
      const frage = angemeldet && !!(w.neuAbgleichOffen && w.neuAbgleichOffen());
      const wo = angemeldet ? String(w.adresse?.() || '') : '';
      const geraet = angemeldet ? String(w.geraeteName?.() || '') : '';
      const einleitung = !angemeldet
        ? 'Ohne Konto liegt alles auf diesem Gerät — so wie bisher, und das bleibt ' +
          'der Normalfall. Redion hat einen eigenen Server; er ist freiwillig und ' +
          'bringt dieselben Notizen auf Rechner und Telefon.'
        : frage
          ? 'Angemeldet — aber der Abgleich wartet auf dich. Du hast eine Sicherung ' +
            'eingespielt und den Bestand ersetzt; auf dem Server liegt noch der Stand ' +
            'von vorher. Bis du im Wolke-Fenster entschieden hast, geht nichts hinaus ' +
            'und nichts herein.'
          : gleichtAb
            ? 'Angemeldet, und dieses Gerät gleicht ab' + (wo ? ' mit ' + esc(wo) : '') +
              '. Private Seiten gehen verschlüsselt hinaus; im Klartext geht nur, was ' +
              'du ausdrücklich teilst oder veröffentlichst.'
            : 'Angemeldet — aber es verlässt nichts dieses Gerät. Der Abgleich ist ' +
              'ausgeschaltet, und ohne ihn bleibt alles lokal.';
      return kopf('Mein Konto', einleitung) +
      zeile('Name', 'So wirst du in Kommentaren genannt', feld('nutzer', V('nutzer', ''), 'Dein Name')) +
      zeile('Symbol', 'Kürzel oben in der Seitenleiste', feld('arbeitsIcon', V('arbeitsIcon', 'N'))) +
      zeile('Anmeldung', angemeldet
              ? 'Mit einem Konto — Wolke, Freigaben und Abgleich sind möglich'
              : 'Ohne Konto — nur mit einem gibt es Abgleich und Freigaben',
            knopf('wolke-oeffnen', angemeldet ? 'Wolke öffnen' : 'Konto einrichten')) +
      zeile('Passwort', 'Einzelne Seiten lassen sich verschlüsseln',
            knopf('seite-sperren', 'Seite verschlüsseln')) +
      zeile('Angemeldete Geräte', angemeldet
              ? 'Die Liste und der Freigabe-Code stehen im Wolke-Fenster'
              : 'Ohne Konto gibt es keine Sitzungen',
            '<span class="ez-grau">' +
              (angemeldet ? esc(geraet || 'dieses Gerät') : 'nur dieses Gerät') +
            '</span>') +
      zeile('Alle Daten auf diesem Gerät löschen',
            angemeldet
              ? 'Leert diesen Browser. Das Konto auf dem Server bleibt — löschen ' +
                'lässt es sich im Wolke-Fenster.'
              : 'Entfernt alle Daten aus diesem Browser',
            knopf('alles-loeschen', 'Alle Daten löschen', 'warn'));
    },

    allgemein: () =>
      kopf('Einstellungen') +
      zeile('Erscheinungsbild', 'Hell, dunkel oder wie das System',
            wahl('theme', [['dark', 'Dunkel'], ['light', 'Hell'], ['system', 'Wie das System']], V('theme', 'dark'))) +
      zeile('Schriftgrösse', 'Gilt für den ganzen Text',
            wahl('schriftgroesse', [['klein', 'Klein'], ['normal', 'Normal'], ['gross', 'Gross']], V('schriftgroesse', 'normal'))) +
      zeile('Zeilenabstand', 'Enger oder luftiger',
            wahl('dichte', [['eng', 'Eng'], ['normal', 'Normal'], ['weit', 'Weit']], V('dichte', 'normal'))) +
      zeile('Beim Öffnen zeigen', 'Was erscheint, wenn du die App startest',
            wahl('startAnsicht', [['dokument', 'Zuletzt geöffnetes Dokument, sonst das Regal'],
                                  ['dokumente', 'Immer das Regal'],
                                  ['start', 'Heute – Lernen & Alltag'], ['workspace', 'Bibliothek – Seiten & Wissen'],
                                  ['notizhefte', 'Notizhefte – Regal zum Losschreiben'],
                                  ['notizheft', 'Zuletzt benutztes Heft, sofort schreibbereit'],
                                  ['letzte', 'Zuletzt geöffnete Seite'],
                                  ['journal', 'Heutiges Journal'], ['posteingang', 'Posteingang']],
                 V('startAnsicht', 'dokument'))) +
      zeile('Woche beginnt am', 'Gilt für Kalender und Kalenderwochen',
            wahl('wochenstart', [['montag', 'Montag'], ['sonntag', 'Sonntag']], V('wochenstart', 'montag'))) +
      zeile('Datumsformat', 'Wie Datumsangaben geschrieben werden',
            wahl('datumsformat', ['TT.MM.JJJJ', 'JJJJ-MM-TT', 'MM/TT/JJJJ', 'TT. Monat JJJJ'],
                 V('datumsformat', 'TT.MM.JJJJ'))) +
      zeile('Zeitformat', '', wahl('zeitformat', [['24', '24 Stunden'], ['12', '12 Stunden']], V('zeitformat', '24'))) +
      zeile('Hoher Kontrast', 'Stärkere Ränder und klarere Farben — leichter zu lesen',
            schalter('kontrast', V('kontrast', false))) +
      zeile('Ruhige Darstellung', 'Keine Animationen und Übergänge',
            wahl('bewegung', [['normal', 'Normal'], ['ruhig', 'Ruhig']], V('bewegung', 'normal'))) +
      zeile('Leichter lesen', 'Mehr Zeilenabstand, weitere Buchstaben, schmalere Zeilen',
            wahl('lesen', [['normal', 'Normal'], ['leicht', 'Leichter']], V('lesen', 'normal'))) +
      zeile('Eingabetaste macht eine neue Zeile', 'Gilt für Chat und Kommentare. ' +
            'Zum Senden dann Strg + Eingabe',
            schalter('enterZeile', V('enterZeile', false))) +
      zeile('Rechtschreibprüfung', 'Die rote Wellenlinie beim Tippen',
            schalter('rechtschreib', V('rechtschreib', false))) +
      zeile('Seitenleiste', 'Beim Start eingeklappt lassen',
            schalter('seiteZu', V('seiteZu', false))) +
      zeile('Sprache', 'Diese App gibt es bisher nur auf Deutsch',
            '<span class="ez-grau">Deutsch</span>'),

    benachricht: () =>
      kopf('Benachrichtigungen', 'Erinnerungen melden sich, solange die App offen ist. ' +
           'Mit Erlaubnis auch als Systemmeldung.') +
      zeile('Systemmeldungen', 'Erlaubnis des Browsers einholen',
            knopf('benachr-erlauben',
                  ('Notification' in window && Notification.permission === 'granted')
                    ? 'Bereits erlaubt' : 'Erlauben')) +
      zeile('Erinnerungen in der App', 'Der Streifen unten am Bildschirm',
            schalter('erinnernInApp', V('erinnernInApp', true))) +
      zeile('Karteikarten', 'Einmal am Tag melden, wenn Karten fällig sind — aus, bis du es einschaltest',
            schalter('kartenMelden', V('kartenMelden', false))) +
      zeile('Offene Erinnerungen', '', `<span class="ez-grau">${Werkzeuge.erinnerungen().filter((e: any) => !e.erledigt).length} offen</span>`) +
      zeile('Alle Erinnerungen', '', knopf('erinnerungen-zeigen', 'Posteingang öffnen')),

    verbindungen: () => {
      const z = Verbindungen.zustand();
      return kopf('Verbindungen', 'Ohne Verbindung läuft alles auf diesem Rechner. Wer will, ' +
           'kann eigene Konten anschliessen — die Schlüssel bleiben in diesem Browser und ' +
           'gehen nur an den jeweiligen Dienst.') +
      zeile('Ollama', 'Lokale KI auf diesem Rechner',
            `<span class="ez-grau">${KI.zustand.quelle === 'ollama' ? 'verbunden' : 'nicht gefunden'}</span> ` +
            knopf('ollama-suchen', 'Erneut suchen')) +
      zeile('WebLLM', 'KI direkt im Browser',
            `<span class="ez-grau">${'gpu' in navigator ? 'möglich' : 'kein WebGPU'}</span>`) +

      kopf('Verbundene Dienste', '') +
      zeile('Google', 'Kalender und Gmail — braucht eine eigene Client-ID, kostenlos',
            `<span class="ez-grau">${z.google.verbunden
              ? 'verbunden' + (z.google.profil ? ' als ' + esc(z.google.profil.email) : '')
              : (z.google.id ? 'Client-ID da, nicht angemeldet' : 'nicht eingerichtet')}</span> ` +
            knopf('verbindungen', 'Einrichten')) +
      zeile('Kalender', 'Google, iCloud und jede ICS-Adresse',
            `<span class="ez-grau">${z.ics.anzahl} Abos</span> ` + knopf('kalender-verb', 'Öffnen', 'weiter')) +
      zeile('Mail', 'Gmail holen, beschriften, beantworten — oder EML-Dateien einlesen',
            knopf('mail-verb', 'Öffnen', 'weiter')) +
      zeile('GitHub und Jira', 'Issues und Vorgänge als gespiegelte Datenbank',
            `<span class="ez-grau">${z.github.verbunden ? 'GitHub verbunden' : 'nicht verbunden'}` +
            `</span> ` + knopf('spiegel-verb', 'Öffnen', 'weiter')) +
      zeile('MCP-Server', 'Fremde Werkzeuge für die KI',
            `<span class="ez-grau">${(Store.getMeta('mcp:server', []) || []).length} eingetragen</span> ` +
            knopf('mcp-verb', 'Öffnen', 'weiter')) +
      zeile('Web Clipper', 'Webseiten sammeln — ohne Browsererweiterung',
            knopf('clipper', 'Einrichten')) +
      zeile('Ordner auf der Festplatte', 'Notizen als Markdown-Dateien ablegen',
            knopf('ordner-schreiben', 'Ordner wählen')) +
      zeile('Brücke', 'Für Dienste, die den Browser nicht direkt heranlassen',
            `<span class="ez-grau">${z.bruecke ? 'eingetragen' : 'keine'}</span> ` +
            knopf('verbindungen', 'Eintragen')) +
      zeile('Anmeldung möglich?', 'Google lässt sie nur von einer echten Adresse zu',
            `<span class="ez-grau">${z.adresse ? 'ja — ' + esc(location.origin)
              : 'nein — als Datei geöffnet, start.bat benutzen'}</span>`);
    },

    arbeitsplatz: () =>
      kopf('Arbeitsbereich') +
      zeile('Name', 'Steht oben in der Seitenleiste', feld('arbeitsName', V('arbeitsName', 'Redion'))) +
      zeile('Symbol', 'Ein Buchstabe oder ein Emoji', feld('arbeitsIcon', V('arbeitsIcon', 'N'))) +
      zeile('Seiten', '', `<span class="ez-grau">${Links.seiten().length}</span>`) +
      zeile('Datenbanken', '', `<span class="ez-grau">${Object.keys(Store.cache.collections).length}</span>`) +
      zeile('Startseite festlegen', 'Welche Seite die Startseite ist',
            knopf('startseite-waehlen', 'Seite wählen')) +
      zeile('Alles als Website ausgeben', 'Eine HTML-Datei mit allen Seiten',
            knopf('einzeldatei', 'Erzeugen')) +
      zeile('Arbeitsbereich löschen', 'Alle Seiten und Datenbanken',
            knopf('alles-loeschen', 'Alles löschen', 'warn')),

    bereiche: () => {
      const liste = V('bereiche', []) || [];
      return kopf('Bereiche', 'Was bei Notion „Teamspaces" heisst: Gruppen für deine Seiten. ' +
                  'Jede Seite kann einem Bereich zugeordnet werden, die Seitenleiste sortiert danach.') +
        '<div class="bereich-liste">' +
        (liste.length ? liste.map((b: any) =>
          `<div class="bereich-zeile"><span class="b-ico">${esc(b.icon)}</span>` +
          `<b>${esc(b.name)}</b>` +
          `<span class="ez-grau">${Links.seiten().filter(p => p.bereich === b.id).length} Seiten</span>` +
          `<button data-bereich-weg="${b.id}" data-loeschknopf aria-label="Bereich „${esc(b.name)}“ löschen">🗑</button></div>`).join('')
          : '<div class="ez-grau" style="padding:10px 0">Noch keine Bereiche angelegt.</div>') +
        '</div>' +
        zeile('Neuen Bereich anlegen', 'Zum Beispiel „Arbeit", „Privat", „Studium"',
              knopf('bereich-neu', 'Bereich anlegen')) +
        zeile('Seite einem Bereich zuordnen', 'Geht auch im Seitenmenü',
              knopf('bereich-zuordnen', 'Seite zuordnen'));
    },

    sicherheit: () =>
      kopf('Sicherheit', 'Alles liegt auf diesem Gerät. Es gibt niemanden, dem man etwas freigeben müsste.') +
      zeile('Seiten verschlüsseln', 'AES-256 mit Passwort, je Seite einzeln',
            knopf('seite-sperren', 'Offene Seite verschlüsseln')) +
      zeile('Verschlüsselte Seiten', '',
            `<span class="ez-grau">${Links.seiten().filter(p => p.locked).length}</span>`) +
      zeile('Gegen Bearbeiten sperren', 'Schutz vor versehentlichem Tippen',
            knopf('seite-schreibschutz', 'Offene Seite sperren')) +
      zeile('Automatische Versionen', 'Beim Seitenwechsel eine Fassung sichern',
            schalter('autoVersionen', V('autoVersionen', true))) +
      kopf('Konten und Rollen', 'Fünf Rollen wie in Notion. Ehrlich gesagt: ohne eigenen ' +
           'Server ist das eine Absprache, kein Schloss — wer die Daten im Browser hat, ' +
           'kommt an alles heran. Die Anmeldung über Google liefert immerhin eine ' +
           'geprüfte Identität.') +
      zeile('Konten', 'Von Hand angelegt oder über Google angemeldet',
            `<span class="ez-grau">${Konten.alle().length} · angemeldet als ` +
            `${esc(Konten.aktiv().name)}</span> ` + knopf('konten', 'Verwalten')) +
      zeile('Berechtigungsmatrix', 'Was darf welche Rolle?',
            knopf('rechte-matrix', 'Ansehen')) +
      zeile('Freigabe dieser Seite', 'Wer darf lesen, kommentieren, bearbeiten',
            knopf('freigabe', 'Öffnen')) +
      zeile('Standardrolle', 'Gilt für Seiten ohne eigene Freigabe',
            wahl('rolleStandard', Konten.ROLLEN.map(r => [r.id, r.icon + ' ' + r.name]),
                 V('rolleStandard', 'voll'))) +
      zeile('Anmeldung über Google', 'Liefert geprüften Namen und geprüfte E-Mail',
            `<span class="ez-grau">${Verbindungen.googleProfil()
              ? esc(Verbindungen.googleProfil().email) : 'nicht angemeldet'}</span> ` +
            knopf('verbindungen', 'Einrichten')) +
      zeile('SAML SSO und Nutzerbereitstellung', 'Braucht einen Identitätsanbieter und einen Server',
            '<span class="ez-grau">nicht möglich ohne Server</span>') +
      zeile('Datenschutz', '',
            '<span class="ez-grau">alles im Browser; nur was du verbindest, geht hinaus</span>'),

    daten: () => {
      /* DIE AUTOMATISCHE SICHERUNG (E270).
         Redur wollte „alle Daten auf iCloud". Ein Browser kann nicht in
         iCloud schreiben — aber er kann in EINEN Ordner schreiben, den
         man ihm gezeigt hat, und wenn dieser Ordner in iCloud Drive (oder
         OneDrive, oder Dropbox) liegt, erledigt den Rest der Dienst
         selbst.
         Kann der Browser das nicht — Safari auf iPhone und iPad, Firefox —
         steht hier ein Satz und KEIN Knopf. Ein Knopf, der beim Drücken
         nichts tut, ist der Fehler, gegen den §47 geschrieben ist. */
      const os = (globalThis as any).OrdnerSicherung;
      const ordnerGeht = !!(os && os.moeglich && os.moeglich());
      const ordnerAn = !!(os && os.an && os.an());
      const ordnerName = ordnerAn ? String(os.name() || '') : '';
      const ordnerFehler = os && os.fehler ? String(os.fehler() || '') : '';
      const ordnerZuletzt = ordnerAn && os.zuletzt ? String(os.zuletzt() || '') : '';
      const ordnerRecht = !ordnerGeht
        ? '<span class="ez-grau">in diesem Browser nicht möglich</span>'
        : ordnerAn
          ? `<span class="ez-grau">${esc(ordnerName)}</span> ` +
            knopf('ordner-sicherung-jetzt', 'Jetzt sichern') + ' ' +
            knopf('ordner-sicherung-aus', 'Abschalten')
          : knopf('ordner-sicherung-an', 'Ordner wählen');
      const ordnerUnter = !ordnerGeht
        ? 'Safari auf iPhone und iPad und Firefox können keinen Ordner behalten. ' +
          'Dort bleibt „Sicherung speichern" von Hand — oder du gleichst über die ' +
          'Wolke ab.'
        : ordnerFehler
          ? ordnerFehler
          : ordnerAn
            ? 'Alle fünf Minuten, aber nur wenn sich etwas geändert hat. Die letzten ' +
              'sieben Tage bleiben vollständig liegen, davor je Monat eine.' +
              (ordnerZuletzt
                /* Ohne Sekunden — bei einer Sicherung, die alle fünf Minuten
                   nachsieht, ist die Sekunde kein Wissen, sondern Lärm. */
                ? ' Zuletzt: ' + esc(new Date(ordnerZuletzt).toLocaleString('de-CH',
                    { dateStyle: 'short', timeStyle: 'short' }))
                : ' Noch nichts geschrieben.')
            : 'Wähle einen Ordner — zum Beispiel in iCloud Drive, OneDrive oder ' +
              'Dropbox. Redion legt dort selbständig vollständige Sicherungen ab, ' +
              'und der Dienst bringt sie auf deine anderen Geräte.';
      return kopf('Import und Export') +
      zeile('Sicherung speichern', 'Alles als eine JSON-Datei', zustandsknopf('export-json')) +
      zeile('Sicherung laden', 'Ersetzt den jetzigen Inhalt', knopf('import-json', 'Laden')) +
      zeile('Markdown-Ordner schreiben', 'Je Seite eine .md-Datei, Unterseiten in Unterordnern',
            knopf('ordner-schreiben', 'Ordner wählen')) +
      zeile('Markdown-Ordner einlesen', 'Legt aus jeder Datei eine Seite an',
            knopf('ordner-lesen', 'Ordner wählen')) +
      zeile('Dateien einlesen', 'Markdown, Text, CSV, TSV, HTML, Excel (.xlsx), Word (.docx), EPUB — ' +
            'Excel wird zur Datenbank, EPUB zu einem Wiki mit Kapiteln',
            knopf('dateien-lesen', 'Dateien wählen')) +
      zeile('Als eine HTML-Datei', 'Zum Weitergeben und Archivieren', zustandsknopf('einzeldatei')) +
      zeile('Offene Seite als Markdown', '', knopf('seite-md', 'Speichern')) +
      zeile('Offene Seite als HTML', '', knopf('seite-html', 'Speichern')) +
      zeile('Offene Seite drucken oder als PDF', '', knopf('seite-pdf', 'Drucken')) +
      zeile('Sicherung in einen Ordner', ordnerUnter,
            ordnerRecht + (ordnerFehler ? ' ' + knopf('ordner-sicherung-an', 'Neu wählen') : '')) +
      /* DER SCHALTER HIESS „Beim Schliessen an eine Sicherung erinnern" (E270).
         Das konnte er nicht halten: beim Entladen einer Seite darf kein
         Fenster mehr aufgehen, und was der Schalter versprach, war nirgends
         gebaut. Jetzt verspricht er, was die Plattform hergibt — und
         `OrdnerSicherung` löst es beim Zurückkommen ein, über dieselbe
         Wochenfrist, die `Sicherung.ERINNERN` ohnehin führt. */
      zeile('An die Sicherung erinnern',
            'Beim Zurückkommen melden, wenn die letzte Sicherung älter als eine ' +
            'Woche ist',
            schalter('sicherungErinnern', V('sicherungErinnern', false)));
    },

    ki: () =>
      kopf('Künstliche Intelligenz', 'Beide Wege sind kostenlos und laufen auf deinem Rechner. ' +
           'Kein Schlüssel, keine Abrechnung, kein Text, der hinausgeht.') +
      zeile('Aktives Modell', '', `<span class="ez-grau">${esc(KI.zustand.modell || 'keins')}</span> ` +
            knopf('ki-modell', 'Wechseln')) +
      zeile('Ollama', 'Schneller und besser, einmalige Installation nötig',
            `<span class="ez-grau">${KI.zustand.quelle === 'ollama' ? 'läuft' : 'nicht gefunden'}</span> ` +
            knopf('ollama-suchen', 'Suchen')) +
      zeile('WebLLM', 'Ohne Installation, dafür langsamer',
            knopf('ki-modell', 'Modell laden')) +
      zeile('Seiteninhalt mitgeben', 'Die KI sieht die offene Seite als Zusammenhang',
            schalter('kiKontext', V('kiKontext', true))) +
      zeile('Antwortlänge', '', wahl('kiLaenge', [['kurz', 'Kurz'], ['normal', 'Normal'], ['lang', 'Ausführlich']],
            V('kiLaenge', 'normal'))) +
      zeile('KI-Felder in Datenbanken', 'Spaltentyp „KI-Feld" füllt sich selbst',
            '<span class="ez-grau">verfügbar</span>') +

      /* --- Quellen: was darf die KI überhaupt sehen? ------------------- */
      kopf('Quellen', 'Die KI weiss nichts über deinen Arbeitsbereich. Sie bekommt die ' +
           'passenden Ausschnitte gereicht — und zwar nur aus den Quellen, die hier ' +
           'eingeschaltet sind. Jede Antwort nennt danach ihre Quellen.') +
      zeile('Die offene Seite', 'Was gerade auf dem Bildschirm steht',
            schalter('q:aktuelleSeite', Kontext.quellen().aktuelleSeite)) +
      zeile('Arbeitsbereich', 'Alle Seiten, die du lesen darfst',
            schalter('q:arbeitsbereich', Kontext.quellen().arbeitsbereich)) +
      /* Gespiegeltes gehört zu „Verbundene Dienste" (E724, D9) — vorher
         stand es hier, und der Schalter darunter hatte keinen Leser. */
      zeile('Datenbanken', 'Deine eigenen Datenbanken',
            schalter('q:datenbanken', Kontext.quellen().datenbanken)) +
      zeile('Verbundene Dienste', 'Mails, Termine und alles, was gespiegelt wird',
            schalter('q:verbindungen', Kontext.quellen().verbindungen)) +
      zeile('Websuche', 'Wikipedia nachschlagen — dabei verlässt der Suchbegriff den Rechner',
            schalter('q:web', Kontext.quellen().web)) +
      zeile('Vor jeder Webanfrage nachfragen', 'Sicherheitshalber einmal bestätigen',
            schalter('ki:webFragen', V('ki:webFragen', true))) +
      /* NUR-QUELLEN-MODUS (E305). Er steht bewusst UNTER den Quellen und
         nicht bei den Antwortlängen: er ist keine Geschmacksfrage, sondern
         die Zusage, dass nichts kommt, was nicht in den eingeschalteten
         Quellen steht. */
      zeile('Nur aus meinen Quellen antworten',
            'Findet sich nichts, wird das Modell gar nicht erst gefragt — statt ' +
            'einer Antwort, die nirgends nachzulesen ist',
            schalter('ki:nurQuellen', V('ki:nurQuellen', false))) +

      /* --- Gedächtnis --------------------------------------------------- */
      kopf('Gedächtnis', 'Die KI erinnert sich nicht wie ein Mensch. Sie findet wieder, ' +
           'was du gespeichert hast. Der Suchindex ist dieses Gedächtnis.') +
      zeile('Suchindex', 'Wird bei Bedarf neu gebaut',
            `<span class="ez-grau">${Kontext.holen().anzahl} Einträge</span> ` +
            knopf('index-neu', 'Neu bauen')) +
      zeile('Echte Vektoren', 'Genauere Suche über einen Anbieter — kostet ein paar Cent, ' +
            'braucht einen Schlüssel bei Gemini oder OpenAI',
            schalter('ki:embeddings', V('ki:embeddings', false)) + ' ' +
            knopf('emb-bauen', 'Berechnen')) +
      zeile('Anbieter für Vektoren', '',
            wahl('ki:embAnbieter', [['gemini', 'Google Gemini'], ['openai', 'OpenAI']],
                 V('ki:embAnbieter', 'gemini'))) +
      zeile('Dauerhafte Anweisungen', 'Gilt für jede Antwort und jeden Agenten',
            `<textarea data-set="ki:persoenlich" rows="3" class="ez-lang" ` +
            `placeholder="z. B. Antworte immer auf Deutsch. Fasse lange Antworten am Ende ` +
            `kurz zusammen.">${esc(V('ki:persoenlich', ''))}</textarea>`) +

      /* --- Agenten und Besprechungen ------------------------------------ */
      kopf('Agenten und Besprechungen', '') +
      zeile('Agenten', 'Vier feste Typen plus eigene mit eigenen Rechten',
            `<span class="ez-grau">${Agent.alle().length} vorhanden</span> ` +
            knopf('agent-verwalten', 'Verwalten')) +
      zeile('Workers', 'Eigener Code als Werkzeug, läuft abgeschottet',
            `<span class="ez-grau">${Agent.worker().length}</span> ` +
            knopf('agent-worker', 'Bearbeiten')) +
      zeile('Besprechungsnotizen', 'Aufnehmen, mitschreiben, auswerten',
            `<span class="ez-grau">${Meeting.kannZuhoeren() ? 'Mitschreiben geht' : 'nur Aufnahme'}` +
            `</span> ` + knopf('meet-einst', 'Einstellungen')) +

      /* --- Kosten und Grenzen (L104 Punkt 1, E321) ------------------------
         Das Buch gab es seit E287, die Griffe `stand()`, `monatJeAnbieter()`
         und `grenzenSetzen()` auch — nur sah man nichts davon. Wer seine
         Grenzen ändern wollte, konnte es allein über die Konsole. Das ist
         §47 von der leisen Seite: eine Bremse, die wirkt, aber die niemand
         einstellen kann, ist eine fremde Entscheidung. */
      (() => {
        const lage = KiKosten.belegLage(KiBuch.buchungen(),
                                        new Date().toISOString().slice(0, 7));
        const stand = KiBuch.stand();
        const g = KiBuch.grenzen();
        const jeAnb = KiBuch.monatJeAnbieter();
        const alt = KiKosten.standSatz(Date.now());

        const grenzfeld = (k: string, wert: number) =>
          `<input type="number" min="0" step="0.01" class="ez-grenze" ` +
          `data-grenze="${k}" value="${esc(String(wert))}"> ` +
          `<span class="ez-grau">${esc(KiKosten.WAEHRUNG)}</span>`;

        return kopf('Kosten und Grenzen',
          'Gilt nur für Wolken-Modelle mit eigenem Schlüssel. Ollama und WebLLM ' +
          'kosten nichts und werden nicht gebremst.') +

          /* DIE ZAHL MIT IHRER GRUNDLAGE, wie E289 es für die Lernzahlen
             vormacht. Und ohne Buchung steht hier nichts — „0,00 $, 0 %
             gezählt" wäre eine Zeile, die nichts behauptet. */
          (lage.anzahl
            ? zeile('Diesen Monat', esc(KiKosten.belegSatz(lage)),
                    `<b>${esc(KiKosten.geld(stand.monat))}</b>`) +
              zeile('Heute', '', `<span class="ez-grau">${esc(KiKosten.geld(stand.heute))}</span>`) +
              /* NUR ANBIETER, DIE ETWAS GEKOSTET HABEN. Groq mit einem
                 freien Modell steht sonst mit „0,00 USD" da — eine Zeile,
                 die nichts behauptet und trotzdem Platz nimmt. Wer wissen
                 will, wohin das Geld geht, will die sehen, die welches
                 gekostet haben. */
              Object.keys(jeAnb).filter(a => (jeAnb[a] ?? 0) > 0).sort().map(a =>
                zeile(esc(a), '', `<span class="ez-grau">${esc(KiKosten.geld(jeAnb[a] ?? 0))}</span>`)
              ).join('')
            : zeile('Diesen Monat', 'Noch kein Wolken-Aufruf verbucht.',
                    '<span class="ez-grau">—</span>')) +

          zeile('Höchstens je Aufruf', 'Darüber fragt Redion nicht an',
                grenzfeld('jeAufruf', g.jeAufruf)) +
          zeile('Höchstens je Agentenlauf', 'Eine Schleife, die entgleist, kostet nichts weiter',
                grenzfeld('jeLauf', g.jeLauf)) +
          zeile('Höchstens am Tag', '', grenzfeld('jeTag', g.jeTag)) +
          zeile('Höchstens im Monat', '', grenzfeld('jeMonat', g.jeMonat)) +

          /* Der Hinweis zur alternden Preisliste kommt erst nach einem
             halben Jahr (E319). Bis dahin steht hier nur das Datum. */
          zeile('Preisliste', alt ? '<b>' + esc(alt) + '</b>'
                                  : 'Stand: ' + esc(KiKosten.STAND),
                knopf('ki-buch-leeren', 'Buch leeren'));
      })() +

      /* --- Datenschutz --------------------------------------------------- */
      kopf('Datenschutz', '') +
      zeile('Daten zur Verbesserung freigeben', 'Es gibt niemanden, an den etwas ginge',
            '<span class="ez-grau">aus — dauerhaft</span>') +
      zeile('Wohin dein Text geht', '',
            '<span class="ez-grau">' +
            (KI.zustand.quelle === 'wolke'
              ? 'an ' + (KI.anbieter(KI.zustand.anbieter).name) + ' — dein Schlüssel, dein Konto'
              : 'nirgendwohin — das Modell läuft auf diesem Rechner') + '</span>'),

    schluessel: () => {
      const zeilen = KI.ANBIETER.map((a: any) => {
        const wert = V('api:' + a.id, '');
        const gesetzt = !!wert;
        return zeile(
          a.name + (a.frei ? ' <em class="frei">kostenloses Kontingent</em>' : ''),
          a.hinweis + (a.woher ? ' · Schlüssel holen: <b>' + a.woher + '</b>' : ''),
          `<input type="password" data-set="api:${a.id}" value="${esc(wert)}" ` +
          `placeholder="${a.id === 'eigen' ? 'nicht nötig' : 'Schlüssel einfügen'}" autocomplete="off">` +
          (gesetzt ? '<button class="ez-knopf" data-tun="pruefen:' + a.id + '">Prüfen</button>' : ''));
      }).join('');

      return kopf('Schlüssel und APIs',
        'Hier hinterlegst du eigene Zugänge. Alles bleibt in diesem Browser und geht nur an ' +
        'den jeweiligen Anbieter — nie an mich, nie an sonst jemanden. ' +
        'Die App läuft auch ganz ohne Schlüssel: Ollama und WebLLM brauchen keinen.') +

        '<div class="ez-plan"><b>Erst das Kostenlose</b><span>' +
        'Ohne jeden Schlüssel: <b>Ollama</b> auf dem Rechner und <b>WebLLM</b> im Browser. ' +
        'Mit kostenlosem Kontingent und eigenem Schlüssel: <b>Groq</b>, <b>OpenRouter</b> ' +
        '(Modelle mit <code>:free</code>) und <b>Google Gemini</b>. ' +
        'Danach erscheinen die Modelle oben rechts im KI-Panel zur Auswahl.' +
        '</span></div>' +

        '<h3 class="ez-h3">Sprachmodelle</h3>' + zeilen +

        zeile('Adresse des eigenen Servers', 'Alles, was wie OpenAI antwortet — LM Studio, llama.cpp, vLLM',
              feld('api:eigenUrl', V('api:eigenUrl', ''), 'http://localhost:1234/v1/chat/completions')) +
        zeile('Modellname beim eigenen Server', '', feld('api:eigenModell', V('api:eigenModell', ''), 'z. B. local-model')) +

        '<h3 class="ez-h3">Weitere Dienste</h3>' +
        zeile('Notion', 'Für den Import aus einem echten Notion-Arbeitsbereich. ' +
              'Schlüssel holen: <b>notion.so/my-integrations</b>',
              feld('api:notion', V('api:notion', ''), 'secret_… oder ntn_…')) +
        zeile('Webhook-Adresse', 'Automationen können hier etwas hinschicken — Zapier, Make, n8n, eigener Server',
              feld('api:webhook', V('api:webhook', ''), 'https://…')) +
        /* Anmeldung am Webhook — Notion schickt gar keine mit, viele Dienste
           weisen deshalb jede Anfrage ab. */
        zeile('Webhook-Anmeldung', 'Wie sich Redion beim Webhook ausweist',
              '<select data-set="webhookAuthArt">' +
              [['keine', 'ohne Anmeldung'],
               ['bearer', 'Bearer-Schlüssel im Kopf'],
               ['basic', 'Basic (name:passwort)'],
               ['kopf', 'eigener Kopfzeilenname'],
               ['geheim', 'Geheimnis im Datenpaket']]
                .map(([id, n]) => `<option value="${id}"` +
                  (V('webhookAuthArt', 'keine') === id ? ' selected' : '') + `>${n}</option>`).join('') +
              '</select>') +
        zeile('Schlüssel oder Passwort für den Webhook', 'Bleibt im Browser und geht nur an diese eine Adresse',
              feld('api:webhookAuth', V('api:webhookAuth', ''), 'Schlüssel')) +
        zeile('Name der Kopfzeile', 'Nur bei „eigener Kopfzeilenname"',
              feld('webhookAuthName', V('webhookAuthName', 'X-Api-Key'), 'X-Api-Key')) +
        zeile('Wetterdienst', 'Open-Meteo braucht keinen Schlüssel und ist kostenlos',
              '<span class="ez-grau">kein Schlüssel nötig</span>') +
        zeile('Karten', 'OpenStreetMap braucht keinen Schlüssel und ist kostenlos',
              '<span class="ez-grau">kein Schlüssel nötig</span>') +
        zeile('Wikipedia', 'Nachschlagen ohne Schlüssel, direkt aus der KI heraus',
              '<span class="ez-grau">kein Schlüssel nötig</span>') +

        '<div class="ez-warnung">Ein Schlüssel im Browser ist bequem, aber nicht geheim: ' +
        'Wer an dieses Browserprofil kommt, kann ihn auslesen. Nimm deshalb Schlüssel mit ' +
        'engem Rahmen und lösche sie, wenn du sie nicht mehr brauchst.</div>';
    },

    speicher: () =>
      kopf('Speicher', 'Alles liegt in IndexedDB in diesem Browserprofil.') +
      '<div id="speicher-zahlen" class="ez-grau" style="padding:4px 0 14px">wird gemessen …</div>' +
      zeile('Blöcke', '', `<span class="ez-grau">${Object.keys(Store.cache.blocks).length}</span>`) +
      zeile('Datenbanken', '', `<span class="ez-grau">${Object.keys(Store.cache.collections).length}</span>`) +
      zeile('Ansichten', '', `<span class="ez-grau">${Object.keys(Store.cache.views).length}</span>`) +
      /* „N Seiten" stimmte nur zur Hälfte: daneben lagen weggelegte Blöcke,
         die niemand zählte und niemand zeigte. Wer hier eine Zahl liest,
         soll wissen, wie viel wirklich im Papierkorb liegt. */
      zeile('Papierkorb', '', `<span class="ez-grau">${Store.trashed().length} Seiten` +
            ((Store.papierkorbBloecke ? Store.papierkorbBloecke().length : 0)
              ? `, ${Store.papierkorbBloecke().length} Blöcke` : '') +
            '</span> ' + knopf('papierkorb', 'Öffnen')) +
      zeile('Papierkorb selbst leeren', 'Nach dieser Frist wird endgültig gelöscht — wie Notions 30 Tage',
            wahl('papierkorbTage', [['30', 'nach 30 Tagen'], ['7', 'nach 7 Tagen'],
                                    ['90', 'nach 90 Tagen'], ['0', 'nie']],
                 String(V('papierkorbTage', 30)))) +
      zeile('Alte Versionen aufräumen',
            'Dünnt aus statt abzuschneiden: die jüngsten bleiben, danach eine je Tag, ' +
            'danach eine je Monat. Von Hand gesicherte bleiben alle',
            knopf('versionen-aufraeumen', 'Aufräumen')) +
      zeile('Speicher dauerhaft anfordern', 'Der Browser räumt die Daten dann nicht von selbst weg',
            knopf('speicher-sichern', 'Anfordern')) +

      /* --- Lange Arbeiten (L103 Punkt 5, E342) ---------------------------
         OCR über achtzig Seiten, ein grosser Import, ein Embedding-Lauf.
         Die Auftragsmaschine konnte sie seit E286 überleben, aber nicht
         WARTEN WOLLEN — sie liefen, sobald sie dran waren. Ohne diesen
         Abschnitt wäre der Zeitplan da und niemand käme heran (§47), wie
         die KI-Grenzen vor E321. */
      (() => {
        const b: any = (typeof Auftraege !== 'undefined' && Auftraege.plan)
          ? Auftraege.plan() : null;
        const l: any = (typeof Auftraege !== 'undefined' && Auftraege.lage)
          ? Auftraege.lage() : { laedt: null, teuer: null };
        /* DIE UHRZEIT ZEIGT DER BROWSER, NICHT REDION. Ein
           `<input type="time">` folgt der Spracheinstellung des BROWSERS,
           nicht dem `lang` des Dokuments — nachgemessen: `lang="de"` am
           Feld ändert gar nichts. Auf einem englisch eingestellten Browser
           steht dort „10:00 PM", während der Satz darüber „22:00" sagt.

           Das bleibt so, und zwar mit Absicht: ein eigenes Feld verlöre die
           Uhr zum Antippen, die Tastaturbedienung und das Rad am Telefon
           (§37, §38). Wer seinen Browser auf Englisch stellt, ERWARTET
           „10:00 PM". Der Satz darüber sagt es zusätzlich auf Deutsch. */
        const zeit = (k: string, wert: any) =>
          `<input type="time" class="ez-plan-zeit" data-plan="${k}" ` +
          `value="${esc(Zeitplan.uhr(wert) || '')}">`;
        /* `schalter`, NICHT `ez-schalter`. Der erste Wurf erfand die zweite
           Klasse, und weil es dazu kein Stück CSS gibt, stand dort ein
           Knopf ohne Grösse, ohne Farbe, ohne alles — ein Schalter, den
           niemand sehen und niemand treffen kann (§47). Kein Prüflauf
           hatte etwas dagegen; gefunden auf dem Bild (§55.1). */
        const haken = (k: string, an: boolean) =>
          `<button type="button" class="schalter${an ? ' an' : ''}" ` +
          `data-plan-an="${esc(k)}" role="switch" aria-checked="${an ? 'true' : 'false'}" ` +
          `aria-label="${esc(k)}"><i></i></button>`;

        return kopf('Lange Arbeiten',
          'Gilt für neue Aufträge — Seitenbilder, OCR, grosse Sicherungen. ' +
          'Was schon läuft, läuft weiter.') +

          /* DER SATZ NUR, WENN ES EINEN GIBT. Ohne Zeitplan steht hier
             nichts — eine Zeile „kein Zeitplan eingestellt" wäre eine
             Zeile, die nichts behauptet (E321, gleiche Stelle). */
          (Zeitplan.hatBedingung(b)
            ? zeile('Eingestellt', '', `<b>${esc(Zeitplan.satz(b))}</b>`)
            : '') +

          /* „Nur von … bis …" und nicht „zwischen … und …" — damit die Zeile
             dieselben Wörter benutzt wie der Satz zwei Zeilen darüber. */
          zeile('Nur von', 'Leer lassen heisst: zu jeder Zeit',
                zeit('von', b && b.vonMinute) + ' <span class="ez-grau">bis</span> ' +
                zeit('bis', b && b.bisMinute)) +

          /* WAS DER BROWSER NICHT WEISS, STEHT DABEI. Firefox und Safari
             kennen `getBattery` nicht; dort wirkt „nur am Strom" nicht,
             und das gehört an den Schalter geschrieben statt still zu
             geschehen. Ein Auftrag wartet deswegen trotzdem nie ewig:
             unbekannt heisst ja (siehe `core/jobs/zeitplan.ts`). */
          zeile('Nur am Strom',
                l.laedt === null
                  ? 'Dieser Browser sagt nicht, ob geladen wird — der Schalter bleibt dann wirkungslos'
                  : (l.laedt ? 'Das Gerät lädt gerade' : 'Das Gerät lädt gerade nicht'),
                haken('amStrom', !!(b && b.amStrom))) +

          zeile('Nicht über eine teure Verbindung',
                l.teuer === null
                  ? 'Dieser Browser sagt nichts über die Verbindung — der Schalter bleibt dann wirkungslos'
                  : (l.teuer ? 'Die Verbindung kostet gerade' : 'Die Verbindung kostet gerade nichts'),
                haken('nichtTeuer', !!(b && b.nichtTeuer)));
      })(),

    abrechnung: () =>
      kopf('Abrechnung') +
      '<div class="ez-plan"><b>Kostenlos, für immer</b>' +
      '<span>Keine Stufen, kein Abo, keine Begrenzung auf Blöcke, Gäste oder Dateigrössen. ' +
      'Diese App läuft auf deinem Rechner — es entstehen keine Kosten, die jemand abrechnen könnte.</span></div>' +
      zeile('Plan', '', '<span class="ez-grau">Alles enthalten</span>') +
      zeile('Mitglieder', '', '<span class="ez-grau">du</span>') +
      zeile('KI-Guthaben', 'Lokale Modelle rechnen nicht ab', '<span class="ez-grau">unbegrenzt</span>') +
      zeile('Speicherplatz', 'So viel, wie dein Browser hergibt', '<span class="ez-grau">gerätabhängig</span>') +
      zeile('Rechnungen', '', '<span class="ez-grau">keine</span>'),

    /* --- MCP ------------------------------------------------------------ */
    mcp: () => {
      const server = Store.getMeta('mcp:server', []) || [];
      const aus = Store.getMeta('mcp:eigenAus', []) || [];
      /* Kein lokaler Pseudoschalter: gültige Rechte liegen beim Cloud-Server.
       * Der Login über OAuth muss eine Schreibfreigabe tatsächlich erteilen. */
      const wolke = typeof Wolke === 'undefined' ? null : Wolke;
      let freigaben = '<span class="ez-grau">Wolke-Anmeldung erforderlich</span>';
      try {
        const basis = new URL(wolke?.angemeldet?.() ? String(wolke.adresse?.() || '') : '');
        if (basis.protocol === 'https:' && !basis.username && !basis.password &&
            (basis.pathname === '/' || basis.pathname === '') && !basis.search && !basis.hash) {
          const ziel = new URL('/mcp/settings', basis);
          freigaben = `<a class="ez-knopf" href="${esc(ziel.href)}" target="_blank" rel="noopener noreferrer">Freigaben verwalten</a>`;
        }
      } catch { /* Ohne eingerichtete Cloud bleibt die Funktion lokal. */ }
      return RegisterAutomatisierung.ansicht() + kopf('MCP', 'Ein offenes Protokoll, mit dem Programme fremde Werkzeuge ' +
        'benutzen und eigene anbieten. Diese App kann beides — mit einer Einschränkung, ' +
        'die unten steht.') +
      zeile('ChatGPT & KI-Freigaben',
            'Beim Verbinden der KI-Anwendung kannst du Schreiben ausdrücklich erlauben. ' +
            'Ein bestehender Lesezugang wird dadurch nicht automatisch erweitert. ' +
            'Die Freigabe verlangt den Cloud-MCP-Dienst und eine erneute Schreibanfrage des KI-Clients.',
            freigaben) +
      zeile('Fremde Server', 'Werkzeuge, die dein Agent benutzen darf',
            `<span class="ez-grau">${server.length} eingetragen</span> ` +
            knopf('mcp-verb', 'Verwalten')) +
      zeile('Eigene Werkzeuge', 'Der Katalog dieser App im MCP-Format',
            `<span class="ez-grau">${MCP.eigenerKatalog().length} freigegeben, ` +
            `${aus.length} abgeschaltet</span> ` + knopf('mcp-verb', 'Ansehen')) +
      zeile('Freigabeliste', 'Nur mit diesen Adressen wird gesprochen',
            `<span class="ez-grau">${(MCP.freigegeben().length
              ? MCP.freigegeben().join(', ') : 'keine Sperre')}</span>`) +
      zeile('Als Server erreichbar?', 'Ein Browser kann nichts entgegennehmen',
            '<span class="ez-grau">nur über die Brücke — bruecke.js oder Cloudflare</span>') +
      zeile('Protokollfassung', '', `<span class="ez-grau">${MCP.VERSION}</span>`);
    },

    /* --- Öffentliche Seiten --------------------------------------------- */
    oeffentlich: () => {
      const seiten = Links.seiten().filter(p2 => p2.oeffentlich);
      return kopf('Öffentliche Seiten', 'In Notion heisst das „im Web veröffentlichen". ' +
        'Ohne Server kann diese App keine Seite ins Netz stellen — was sie kann: eine ' +
        'fertige HTML-Datei erzeugen, die überall läuft, und die ganze App bei ' +
        'Cloudflare veröffentlichen.') +
      zeile('Als HTML-Datei ausgeben', 'Eine Seite, die überall aufgeht — ohne diese App',
            knopf('html-seite', 'Offene Seite ausgeben')) +
      zeile('Ganzen Arbeitsbereich ausgeben', 'Eine einzige Datei mit allem',
            knopf('archiv', 'Erzeugen')) +
      zeile('Zum Veröffentlichen vorgemerkt', 'Diese Seiten kommen beim Ausgeben mit',
            `<span class="ez-grau">${seiten.length}</span> ` +
            knopf('oeff-merken', 'Offene Seite vormerken')) +
      (seiten.length
        ? seiten.slice(0, 12).map(p2 =>
            zeile(esc(p2.icon || '📄') + ' ' + esc(p2.text || 'Ohne Titel'), '',
                  `<button class="ez-knopf" data-tun="oeff-weg:${p2.id}">Entfernen</button>`)).join('')
        : '') +
      zeile('Die ganze App im Netz', 'Cloudflare Pages, kostenlos',
            '<span class="ez-grau">CLOUDFLARE.md im App-Ordner</span>');
    },

    /* --- Worker ---------------------------------------------------------- */
    worker: () => {
      const liste = Agent.worker();
      return kopf('Worker', 'Kleine Programme, die auf deine Daten losgelassen werden — ' +
        'in einem eigenen Faden, ohne Zugriff auf die Seite. Notion nennt das seit 2026 ' +
        '„Worker"; hier läuft es in einem Web Worker mit fünf Sekunden Zeitgrenze.') +
      zeile('Neuen Worker schreiben', 'JavaScript, bekommt die Zeilen als eingabe',
            knopf('worker-neu', 'Schreiben')) +
      zeile('Vorhanden', '', `<span class="ez-grau">${liste.length}</span>`) +
      (liste.length
        ? liste.map((w: any, i: any) =>
            zeile('⌨️ ' + esc(w.name), esc((w.code || '').slice(0, 70)) + ' …',
              `<button class="ez-knopf" data-tun="worker-lauf:${i}">Laufen lassen</button> ` +
              `<button class="ez-knopf" data-tun="worker-weg:${i}">Löschen</button>`)).join('')
        : '<div class="ez-grau" style="padding:8px 0">Noch keiner. Ein Worker bekommt ' +
          '<code>eingabe</code> und gibt mit <code>return</code> etwas zurück.</div>') +
      zeile('Zeitgrenze', 'Danach wird abgebrochen',
            wahl('workerZeit', [['5', '5 Sekunden'], ['15', '15 Sekunden'], ['30', '30 Sekunden']],
                 V('workerZeit', '5'))) +
      zeile('Was ein Worker darf', 'Rechnen, umformen, zusammenzählen',
            '<span class="ez-grau">kein DOM, kein Netz, kein Speicherzugriff</span>');
    },

    /* --- Verifizierte Seiten --------------------------------------------- */
    verifiziert: () => {
      const alle = Object.values<any>(Store.cache.blocks)
        .filter(b2 => b2.type === 'page' && b2.alive !== false && !b2.system);
      const geprueft = alle.filter(p2 => p2.geprueft);
      const faellig = geprueft.filter(p2 => p2.gepruefBis && Date.parse(p2.gepruefBis) < Date.now());
      return kopf('Verifizierte Seiten', 'Eine geprüfte Seite trägt oben ein Häkchen: ' +
        'jemand hat bestätigt, dass der Inhalt stimmt. Läuft die Prüfung ab, ' +
        'verschwindet das Häkchen wieder.') +
      zeile('Offene Seite prüfen', 'Setzt das Häkchen und trägt dich als Prüfer ein',
            knopf('pruef-setzen', 'Als geprüft markieren')) +
      zeile('Gültigkeitsdauer', 'Wie lange eine Prüfung hält',
            wahl('pruefDauer', [['30', 'Ein Monat'], ['90', 'Drei Monate'],
                                ['180', 'Ein halbes Jahr'], ['0', 'Ohne Ablauf']],
                 V('pruefDauer', '90'))) +
      zeile('Geprüft', '', `<span class="ez-grau">${geprueft.length} von ${alle.length}</span>`) +
      zeile('Abgelaufen', 'Die brauchen einen neuen Blick',
            `<span class="ez-grau">${faellig.length}</span>` +
            (faellig.length ? ' ' + knopf('pruef-erneuern', 'Alle erneuern') : '')) +
      (geprueft.length
        ? geprueft.slice(0, 12).map(p2 =>
            zeile((p2.geprueft ? '✔️ ' : '') + esc(p2.text || 'Ohne Titel'),
              'geprüft von ' + esc(p2.geprueftVon || 'dir') +
              (p2.gepruefBis ? ' · gültig bis ' + String(p2.gepruefBis).slice(0, 10) : ''),
              `<button class="ez-knopf" data-tun="pruef-weg:${p2.id}">Häkchen entfernen</button>`)).join('')
        : '');
    },

    /* --- Analysen -------------------------------------------------------- */
    analysen: () => {
      const bloecke = Object.values<any>(Store.cache.blocks).filter(b2 => b2.alive !== false);
      const seiten = bloecke.filter(b2 => b2.type === 'page' && !b2.system);
      const dbs = Object.values<any>(Store.cache.collections);
      const zeilen2 = dbs.reduce((n, c) => n + Store.rowsOf(c.id).length, 0);
      const woerter = bloecke.reduce((n, b2) =>
        n + ((b2.text || '').trim() ? b2.text.trim().split(/\s+/).length : 0), 0);
      const aufrufe = seiten.reduce((n, p2) => n + (p2.aufrufe || 0), 0);
      const meist = [...seiten].sort((a, b2) => (b2.aufrufe || 0) - (a.aufrufe || 0)).slice(0, 8);
      const tage: Record<string, number> = {};
      seiten.forEach(p2 => {
        const t = String(p2.created || '').slice(0, 10);
        if (t) tage[t] = (tage[t] || 0) + 1;
      });
      const letzte = Object.entries<any>(tage).sort().slice(-7);
      const hoch = Math.max(1, ...letzte.map(x => Number(x[1]) || 0));

      return kopf('Analysen', 'Wie viel hier steht und was am meisten benutzt wird. ' +
        'Alle Zahlen kommen aus diesem Gerät — es wird nichts gemeldet.') +
      '<div class="an-kacheln">' +
        [[seiten.length, 'Seiten'], [bloecke.length, 'Blöcke'], [dbs.length, 'Datenbanken'],
         [zeilen2, 'Zeilen'], [woerter.toLocaleString('de-CH'), 'Wörter'], [aufrufe, 'Aufrufe']]
          .map(([n, t]) => `<div class="an-kachel"><b>${n}</b><span>${t}</span></div>`).join('') +
      '</div>' +
      zeile('Neue Seiten je Tag', 'Die letzten sieben Tage mit Zuwachs',
            '<div class="an-balken">' +
            (letzte.length
              ? letzte.map(([t, n]) =>
                  `<i style="height:${Math.round(n / hoch * 100)}%" title="${t}: ${n}"></i>`).join('')
              : '<span class="ez-grau">noch keine</span>') + '</div>') +
      (meist.length
        ? '<div class="ez-grp">Meist geöffnet</div>' +
          meist.map(p2 => zeile(esc(p2.icon || '📄') + ' ' + esc(p2.text || 'Ohne Titel'), '',
                `<span class="ez-grau">${p2.aufrufe || 0}×</span>`)).join('')
        : '') +
      zeile('Als CSV ausgeben', 'Zahlen zum Weiterrechnen',
            knopf('analysen-csv', 'Herunterladen'));
    },

    /* --- Emoji ----------------------------------------------------------- */
    emoji: () => {
      const eigene = Store.getMeta('emoji:eigene', []) || [];
      return kopf('Emoji', 'Eigene Bilder als Symbol für Seiten und Datenbanken. ' +
        'Sie liegen im Browser und werden nirgendwohin geschickt.') +
      zeile('Eigenes Symbol hinzufügen', 'Bild wählen — wird auf 64 Pixel gebracht',
            knopf('emoji-neu', 'Bild wählen')) +
      zeile('Vorhanden', '', `<span class="ez-grau">${eigene.length}</span>`) +
      (eigene.length
        ? '<div class="emoji-eigene">' + eigene.map((e: any, i: any) =>
            `<button data-tun="emoji-weg:${i}" title="${esc(e.name)} — klicken zum Entfernen">` +
            `<img src="${esc(e.bild)}" alt=""></button>`).join('') + '</div>'
        : '<div class="ez-grau" style="padding:8px 0">Noch keine eigenen Symbole.</div>') +
      zeile('Emoji-Stil', 'Wie die Standardsymbole gezeichnet werden',
            wahl('emojiStil', [['system', 'Wie das Betriebssystem'], ['flach', 'Schlicht']],
                 V('emojiStil', 'system')));
    },

    ueber: () =>
      kopf('Über diese App') +
      '<div class="ez-ueber">' +
      '<p>Eine Notiz- und Datenbank-App im Stil von Notion — vollständig lokal.</p>' +
      '<p>Gebaut auf einer Analyse von Notion (Datenmodell, Blocktypen, Eigenschaften, ' +
      'Filter, Formelsprache, Tastenkürzel, Farben) und dem Vergleich von zwanzig ' +
      'quelloffenen Notiz-Programmen.</p>' +
      '</div>' +
      zeile('Bausteine', '', `<span class="ez-grau">${Blocks.TYPEN.length}</span>`) +
      zeile('Eigenschaftstypen', '', `<span class="ez-grau">${Datenbank.TYPEN.length}</span>`) +
      zeile('Ansichten', '', `<span class="ez-grau">${Datenbank.LAYOUTS.length}</span>`) +
      zeile('Formelfunktionen', '', '<span class="ez-grau">über 130</span>') +
      zeile('Eigene Formelfunktionen',
            'Einmal definieren, in jeder Formel nutzen — Notion kann das nicht',
            knopf('formelbib', 'Bibliothek öffnen')) +
      zeile('Tastenkürzel', '', knopf('kuerzel', 'Alle anzeigen')) +
      zeile('Speicherort der Daten', '', '<span class="ez-grau">IndexedDB „notizen"</span>') +
      /* DER STAND UND DER WEG (E361, L83 Punkt 2): welche Fassung laeuft,
         wann ihr Inhalt zuletzt gebaut wurde, und ob Redur gerade den
         Ordner, start.bat oder Cloudflare ansieht. Drei Wege, und keiner
         nannte sich — jetzt steht es hier, wo man nachsieht, wenn etwas
         „alt aussieht". */
      zeile('Stand', 'Fassung des Programms und der Weg, über den es gerade läuft',
            `<span class="ez-grau ez-stand" data-fassung="${esc(standFassung())}">${esc(standText())}</span>`)
  } as Record<string, () => string>)[b] || (() => kopf('Unbekannt')))();

  /* ========================================================================
   * BEDIENUNG
   * ======================================================================*/
  /** Der eine Zuhörer für die Quellen der KI (E724) — siehe in `binde`. */
  let quellenZuhoerer: (() => void) | null = null;

  const binde = (o: any) => {
    /* Auswahlfelder und Textfelder */
    o.querySelectorAll('[data-set]').forEach((el: any) => {
      el.addEventListener('change', () => {
        let wert = el.value;
        if (el.dataset.set === 'theme' && wert === 'system')
          wert = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        /* DIE ACHTE TÜR (Durchsicht vom 10. Oktober, test602 §1): Hell und
           Dunkel wechseln nur über `Aussehen.grundWechseln` (E727, §8).
           Hier wurde bis dahin nur `theme` geschrieben, und das Schema
           setzte den Grundton gleich wieder zurück — von „Mitternacht"
           aus tat „Hell" nichts. */
        if (el.dataset.set === 'theme' && typeof Aussehen !== 'undefined' && (wert === 'light' || wert === 'dark'))
          Aussehen.grundWechseln(wert);
        else S(el.dataset.set, wert);
        App.zeichneSeite(); App.zeichneBaum();
      });
      if (el.tagName === 'INPUT') el.addEventListener('input', () => {
        S(el.dataset.set, el.value);
        kopfzeileAuffrischen();
      });
    });

    /* Schalter */
    o.querySelectorAll('[data-toggle]').forEach((b: any) => {
      b.addEventListener('click', async () => {
        const k = b.dataset.toggle;

        /* Die Quellen der KI liegen zusammen in einem Eintrag, nicht einzeln.
           Umgeschaltet wird über DENSELBEN Weg wie im KI-Fenster (E724): er
           fragt beim Web in einem Redion-Fenster statt mit `confirm()` und
           meldet es am Bus — die Schalter im Fenster und das Schild am Prompt
           ziehen mit, Klasse UND aria-pressed. Vorher setzte diese Stelle nur
           die Klasse, und das Fenster las weiter „an". */
        if (k.startsWith('q:')) {
          const an = await Kontext.quelleUmschalten(k.slice(2));
          if (an === null) return;
          b.classList.toggle('an', an);
          b.setAttribute('aria-checked', an ? 'true' : 'false');
          return;
        }

        /* `kartenMelden` steht NICHT mehr in dieser Liste: seine Vorgabe ist
           seit E409 aus. Redur bekam den Streifen auf jedem Bildschirm zu
           sehen, ohne je danach gefragt zu haben. Der Schalter bleibt — wer
           die Meldung will, holt sie sich. */
        const neu = !V(k, k === 'erinnernInApp' ||
                          k === 'kiKontext' || k === 'autoVersionen' || k === 'ki:webFragen');
        S(k, neu);
        b.classList.toggle('an', neu);
        /* Ein `role="switch"` sagt seinen Zustand mit `aria-checked` — die
           Klasse allein sieht nur das Auge (§38; gefunden auf dem Weg zu
           E724, derselbe Fehler wie beim Quellschalter). */
        b.setAttribute('aria-checked', neu ? 'true' : 'false');
        if (k === 'rechtschreib') App.zeichneSeite();
      });
    });

    /* Und umgekehrt (E724): schaltet das KI-Fenster eine Quelle um, während
       diese Seite offen ist, ziehen ihre Schalter mit — sonst stünde hier
       „an", während die Quelle aus ist. Der Wert kommt aus der Meldung
       selbst (EIN Schreiber, `Kontext.quelleUmschalten`). Ein Zuhörer
       höchstens: `binde` läuft bei jedem Bereichswechsel, und der vorige
       meldet sich ab; ist das Fenster zu, meldet er sich beim nächsten Mal
       selbst ab. */
    quellenZuhoerer?.();
    quellenZuhoerer = null;
    if (typeof Ereignisse !== 'undefined' && typeof ARTEN !== 'undefined' &&
        o.querySelector('[data-toggle^="q:"]')) {
      quellenZuhoerer = Ereignisse.horche(ARTEN.kiQuellenGeaendert, (d: any) => {
        if (!o.isConnected) { quellenZuhoerer?.(); quellenZuhoerer = null; return; }
        const b = o.querySelector(`[data-toggle="q:${String(d?.quelle || '')}"]`);
        if (!(b instanceof HTMLElement)) return;
        b.classList.toggle('an', !!d.an);
        b.setAttribute('aria-checked', d.an ? 'true' : 'false');
      });
    }

    /* KI-Grenzen (L104 Punkt 1, E321).
       Eigene Verdrahtung und kein `data-set`: die vier Grenzen liegen
       ZUSAMMEN in einem Eintrag `ki:grenzen`, nicht als vier Schlüssel.
       Ein `data-set` schriebe vier neue Einträge und die Bremse läse
       weiter die alten — ein Regler, der sich bewegt und nichts bewirkt
       (§47). */
    o.querySelectorAll('[data-grenze]').forEach((el: any) => {
      const uebernehmen = () => {
        const wert = Number(el.value);
        if (!Number.isFinite(wert) || wert < 0) { el.value = String(KiBuch.grenzen()[el.dataset.grenze]); return; }
        KiBuch.grenzenSetzen({ [el.dataset.grenze]: wert });
      };
      el.addEventListener('change', uebernehmen);
      el.addEventListener('blur', uebernehmen);
    });

    /* Zeitplan für lange Arbeiten (L103 Punkt 5, E342).
       Wieder eigene Verdrahtung, und aus demselben Grund wie eine Zeile
       weiter oben: die vier Werte liegen ZUSAMMEN in einem Eintrag
       `auftragPlan`. Vier `data-set`-Schlüssel wären vier Regler, die sich
       bewegen und nichts bewirken (§47). */
    const planSchreiben = async (aendern: (b: any) => void) => {
      const b: any = { ...(Auftraege.plan() as any || {}) };
      aendern(b);
      await Auftraege.planSetzen(b);
      /* Neu zeichnen, weil der Satz oben („zwischen 22:00 und 06:00 und
         nur am Strom") sich mitändert. */
      (o as any).neuZeichnen && (o as any).neuZeichnen();
    };
    const ausUhr = (text: string): number | null => {
      const m = /^(\d{1,2}):(\d{2})$/.exec(String(text || '').trim());
      if (!m) return null;
      const h = Number(m[1]), min = Number(m[2]);
      if (!(h >= 0 && h < 24 && min >= 0 && min < 60)) return null;
      return h * 60 + min;
    };
    o.querySelectorAll('[data-plan]').forEach((el: any) => {
      el.addEventListener('change', () => {
        const k = el.dataset.plan === 'von' ? 'vonMinute' : 'bisMinute';
        void planSchreiben(b => { 
          const wert = ausUhr(el.value);
          if (wert === null) delete b[k]; else b[k] = wert;
        });
      });
    });
    o.querySelectorAll('[data-plan-an]').forEach((el: any) => {
      el.addEventListener('click', () => {
        const k = el.dataset.planAn;
        void planSchreiben(b => { b[k] = !b[k]; });
      });
    });

    /* Bereiche löschen */
    o.querySelectorAll('[data-bereich-weg]').forEach((b: any) => {
      b.addEventListener('click', () => {
        const id = b.dataset.bereichWeg;
        S('bereiche', (V('bereiche', []) || []).filter((x: any) => x.id !== id));
        Links.seiten().filter(p => p.bereich === id).forEach(p => Store.updateBlock(p.id, { bereich: '' }));
        App.zeichneBaum();
        o.neuZeichnen();
      });
    });

    /* Knöpfe */
    o.querySelectorAll('[data-tun]').forEach((b: any) =>
      b.addEventListener('click', () => tun(b.dataset.tun, o)));

    /* Die Zustandsknöpfe (E441): Platzhalter gegen das echte Element
       tauschen. Ein Platzhalter ohne Auftrag bleibt leer — lieber eine
       Lücke, die auffällt, als ein Knopf, der nichts tut. */
    (o as HTMLElement).querySelectorAll<HTMLElement>('span[data-zk]').forEach(platz => {
      const id = platz.dataset['zk'] ?? '';
      const auftrag = zustandsknopfAuftrag(id);
      if (!auftrag || typeof Zustandsknopf === 'undefined') return;
      const griff = Zustandsknopf.bauen(auftrag);
      griff.element.dataset['zk'] = id;
      platz.replaceWith(griff.element);
    });

    /* Speicherplatz nachreichen */
    const zahlen = o.querySelector('#speicher-zahlen');
    if (zahlen) Store.usage().then(u => {
      zahlen.textContent = (u && u.benutzt !== undefined && u.verfuegbar !== undefined)
        ? `${(u.benutzt / 1048576).toFixed(1)} MB benutzt von etwa ` +
          `${(u.verfuegbar / 1073741824).toFixed(1)} GB, die der Browser erlaubt`
        : 'Der Browser sagt nicht, wie viel Platz belegt ist.';
    });
  };

  const kopfzeileAuffrischen = () => {
    /* SEIT E236 TRÄGT AUCH DIE MENÜLEISTE DAS ZEICHEN (`mb-konto`).
       Hier stand `btn.querySelector('.ws-icon')` — eine Stelle, ein
       Zeichen. Wer es änderte, sah es in der Seitenleiste sofort und in
       der Menüleiste erst nach dem nächsten Neuzeichnen: zwei Buchstaben
       für einen Arbeitsbereich. Gesucht wird deshalb im ganzen Blatt. */
    document.querySelectorAll('.ws-icon').forEach(ico => {
      ico.textContent = V('arbeitsIcon', 'N');
    });
    const btn = document.querySelector('#btn-settings');
    if (!btn) return;
    /* NACH BEDEUTUNG, NICHT NACH PLATZ (E590) — dieselbe Falle wie in
       `schale.ts`: `span[1]` war der Name und ist seit der
       Bewegungsschicht das Zeichen. */
    const name = btn.querySelector('.ws-name');
    if (name) name.textContent = V('arbeitsName', 'Redion');
  };

  const tun = async (was: any, o: any) => {
    const seite = App.aktuelleSeite() ? Store.getBlock(App.aktuelleSeite()) : null;

    if (was === 'ki-buch-leeren') {
      /* GEFRAGT WIRD VORHER. Das Buch ist die einzige Auskunft darüber, was
         die Wolke bisher gekostet hat — weg ist weg, und die 70 Tage
         Historie kommen nicht zurück (§46). */
      /* Im Fenster des Touch Kits statt im Fenster des Browsers (E710):
         dieselbe Frage, der Knopf rot, weil er etwas löscht. */
      if (!(await Dialog.bestaetigen({ titel: 'Alle verbuchten KI-Kosten löschen?',
             text: 'Die Übersicht beginnt danach wieder bei null. Die Grenzen bleiben.',
             ja: 'Löschen', gefahr: true }))) return;
      KiBuch.leeren();
      UI.toast('Das KI-Buch ist leer.');
      o.neuZeichnen && o.neuZeichnen();
      return;
    }

    if (was === 'index-neu') {
      const ix = Kontext.bauen();
      UI.toast('Suchindex neu gebaut: ' + ix.anzahl + ' Einträge');
      o.neuZeichnen && o.neuZeichnen();
      return;
    }
    if (was === 'emb-bauen') {
      if (!V('ki:embeddings', false)) { UI.toast('Erst „Echte Vektoren" einschalten'); return; }
      UI.toast('Vektoren werden berechnet …');
      try {
        const e = await Kontext.embeddingsBauen((n, g) => {
          if (n % 40 === 0) UI.toast(n + ' von ' + g + ' berechnet');
        });
        UI.toast('Fertig: ' + e.neu + ' neu, ' + e.gesamt + ' gespeichert');
      } catch (err: unknown) { UI.banner('Vektoren: ' +
        (err instanceof Error ? err.message : String(err)), 'warn'); }
      return;
    }
    if (was === 'agent-verwalten') { o.remove(); Agent.eigenerDialog(); return; }
    if (was === 'agent-worker')    { o.remove(); Agent.workerDialog(); return; }
    if (was === 'meet-einst')      { Meeting.einstellungenDialog(); return; }
    if (was === 'verbindungen')    { o.remove(); Verbindungen.dialog(); return; }
    if (was === 'kalender-verb')   { o.remove(); Kalender.dialog(); return; }
    if (was === 'mail-verb')       { o.remove(); Mail.dialog(); return; }
    if (was === 'spiegel-verb')    { o.remove(); Spiegel.dialog(); return; }
    if (was === 'clipper')         { o.remove(); Clipper.dialog(); return; }
    if (was === 'mcp-verb')        { o.remove(); MCP.dialog(); return; }
    if (was === 'html-seite') {
      if (!seite) { UI.toast('Erst eine Seite öffnen'); return; }
      /* `Werkzeuge.alsHtmlDatei` gibt es nicht; die Einzeldatei schreibt
         `einzelDatei()`. Der Zweig war tot, es lief immer das Teilen-Menü. */
      Werkzeuge.einzelDatei();
      return;
    }
    if (was === 'oeff-merken') {
      if (!seite) { UI.toast('Erst eine Seite öffnen'); return; }
      Store.updateBlock(seite.id, { oeffentlich: !seite.oeffentlich });
      UI.toast(seite.oeffentlich ? 'Nicht mehr vorgemerkt' : 'Vorgemerkt');
      o.neuZeichnen && o.neuZeichnen();
      return;
    }
    if (was.startsWith('oeff-weg:')) {
      Store.updateBlock(was.slice(9), { oeffentlich: false });
      o.neuZeichnen && o.neuZeichnen();
      return;
    }
    /* --- Worker ---------------------------------------------------------- */
    if (was === 'worker-neu') {
      const name = await UI.frage('Wie heisst der Worker?', 'Zahlen zusammenzählen');
      if (!name) return;
      const code = await UI.frage('JavaScript — bekommt eingabe, gibt etwas zurück',
        'return eingabe.length + " Zeilen";');
      if (!code) return;
      const liste = Agent.worker();
      liste.push({ name, code });
      Store.setMeta('agent:worker', liste);
      o.neuZeichnen && o.neuZeichnen();
      UI.toast('Worker gemerkt');
      return;
    }
    if (was.startsWith('worker-weg:')) {
      const liste = Agent.worker().filter((_: any, i: any) => i !== +was.slice(11));
      Store.setMeta('agent:worker', liste);
      o.neuZeichnen && o.neuZeichnen();
      return;
    }
    if (was.startsWith('worker-lauf:')) {
      const w = Agent.worker()[+was.slice(12)];
      if (!w) return;
      const daten = Object.values<any>(Store.cache.collections)
        .flatMap(c => Store.rowsOf(c.id).map(r => ({ titel: r.text, ...(r.props || {}) })));
      try {
        const raus = await Agent.workerLaufen(w, daten);
        UI.toast('Ergebnis: ' + JSON.stringify(raus).slice(0, 120));
      } catch (e: unknown) { UI.toast('Der Worker ist gescheitert: ' +
        (e instanceof Error ? e.message : String(e))); }
      return;
    }

    /* --- Verifizierte Seiten --------------------------------------------- */
    if (was === 'pruef-setzen') {
      if (!seite) { UI.toast('Erst eine Seite öffnen'); return; }
      const tage = +Store.getMeta('pruefDauer', '90') || 0;
      Store.updateBlock(seite.id, {
        geprueft: true,
        geprueftVon: Store.getMeta('nutzer', '') || 'Ich',
        geprueftAm: Store.now(),
        gepruefBis: tage ? new Date(Date.now() + tage * 86400000).toISOString() : ''
      });
      o.neuZeichnen && o.neuZeichnen();
      App.zeichneSeite();
      UI.toast('Als geprüft markiert');
      return;
    }
    if (was.startsWith('pruef-weg:')) {
      Store.updateBlock(was.slice(10), { geprueft: false, gepruefBis: '' });
      o.neuZeichnen && o.neuZeichnen();
      App.zeichneSeite();
      return;
    }
    if (was === 'pruef-erneuern') {
      const tage = +Store.getMeta('pruefDauer', '90') || 0;
      Object.values<any>(Store.cache.blocks)
        .filter(p2 => p2.geprueft && p2.gepruefBis && Date.parse(p2.gepruefBis) < Date.now())
        .forEach(p2 => Store.updateBlock(p2.id, {
          gepruefBis: tage ? new Date(Date.now() + tage * 86400000).toISOString() : '',
          geprueftAm: Store.now()
        }));
      o.neuZeichnen && o.neuZeichnen();
      UI.toast('Prüfungen erneuert');
      return;
    }

    /* --- Analysen -------------------------------------------------------- */
    if (was === 'analysen-csv') {
      const seiten = Object.values<any>(Store.cache.blocks)
        .filter(b2 => b2.type === 'page' && b2.alive !== false && !b2.system);
      const zeilen2 = [['Seite', 'Aufrufe', 'Angelegt', 'Zuletzt geändert']]
        .concat(seiten.map(p2 => [
          (p2.text || 'Ohne Titel').replace(/"/g, '""'),
          p2.aufrufe || 0, String(p2.created || '').slice(0, 10),
          String(p2.edited || '').slice(0, 10)
        ]));
      const csv = zeilen2.map(z => z.map(x => `"${x}"`).join(';')).join('\n');
      const l = document.createElement('a');
      l.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }));
      l.download = 'notizen-analysen.csv';
      l.click();
      UI.toast('CSV gespeichert');
      return;
    }

    if (was === 'emoji-neu') {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*';
      inp.addEventListener('change', async () => {
        const f = inp.files?.[0];
        if (!f) return;
        if (f.size > 2 * 1024 * 1024) { UI.toast('Bitte ein Bild unter 2 MB'); return; }
        const bild = await new Promise(ok2 => {
          const fr = new FileReader();
          fr.onload = () => {
            /* Auf 64 Pixel bringen — sonst wird der Speicher voll */
            const img = new Image();
            img.onload = () => {
              const c = document.createElement('canvas');
              c.width = c.height = 64;
              const g = c.getContext('2d');
              if (!g) { ok2(String(fr.result ?? '')); return; }
              g.drawImage(img, 0, 0, 64, 64);
              ok2(c.toDataURL('image/png'));
            };
            img.onerror = () => ok2(String(fr.result ?? ''));
            img.src = String(fr.result ?? '');
          };
          fr.readAsDataURL(f);
        });
        const l = Store.getMeta('emoji:eigene', []) || [];
        l.push({ name: f.name.replace(/\.[^.]+$/, ''), bild });
        Store.setMeta('emoji:eigene', l.slice(0, 60));
        UI.toast('Symbol hinzugefügt');
        o.neuZeichnen && o.neuZeichnen();
      });
      inp.click();
      return;
    }
    if (was.startsWith('emoji-weg:')) {
      const l = Store.getMeta('emoji:eigene', []) || [];
      l.splice(+was.slice(10), 1);
      Store.setMeta('emoji:eigene', l);
      o.neuZeichnen && o.neuZeichnen();
      return;
    }
    if (was === 'konten')          { o.remove(); Konten.verwalten(); return; }
    if (was === 'rechte-matrix')   { Konten.matrix(); return; }
    if (was === 'freigabe')        { if (seite) { o.remove(); Konten.freigeben(seite.id); } return; }

    if (was.startsWith('pruefen:')) {
      const id = was.slice(8);
      UI.toast('Frage ' + KI.anbieter(id).name + ' …');
      try {
        KI.zustand.quelle = 'wolke';
        KI.zustand.anbieter = id;
        /* ZUERST FRAGEN, WAS ES GIBT (E661). Die eingebaute Liste veraltet
           still: Redur bekam am 20. September eine 404 für
           `llama-3.3-70b-versatile`, weil Groq es ausgemustert hatte und
           die Liste im Programm es noch führte. Der Probelauf ist der
           natürliche Ort dafür — hier wird der Schlüssel ohnehin das erste
           Mal benutzt. Geht es schief, gilt die eingebaute Liste weiter.

           EIN GRIFF, NICHT ZWEI (E665). „Holen und dann das erste nehmen"
           ist eine Prozedur der KI; diese Seite braucht nur das Ergebnis.
           `test537` hat den zweiten Griff als neuen Querverweis gemeldet,
           und er hatte recht (§5 Regel 1). */
        KI.zustand.modell = await KI.modellWaehlen(id);
        let antwort = '';
        for await (const t of KI.wolkeFragen(
          [{ role: 'user', content: 'Antworte nur mit dem Wort: bereit' }], KI.zustand.modell)) antwort += t;
        UI.toast(antwort.trim() ? '✓ ' + KI.anbieter(id).name + ' antwortet: ' + antwort.trim().slice(0, 40)
                                : 'Antwort war leer');
        KI.zustand.bereit = true;
      } catch (err) {
        UI.banner(KI.anbieter(id).name + ' meldet: ' +
          (err instanceof Error ? err.message : String(err)), 'fehler');
      }
      return;
    }

    const karte = {
      'benachr-erlauben': async () => {
        if (!('Notification' in window)) { UI.toast('Dieser Browser kennt keine Benachrichtigungen'); return; }
        const erg = await Notification.requestPermission();
        UI.toast(erg === 'granted' ? 'Benachrichtigungen erlaubt' : 'Bleiben aus');
        o.neuZeichnen();
      },
      'erinnerungen-zeigen': () => { o.remove(); Ansichten.posteingang(); },
      'ollama-suchen': async () => { UI.toast('Suche nach Ollama …'); await KI.start();
                                        (o as HTMLElement & { neuZeichnen?: () => void }).neuZeichnen?.(); },
      'ki-modell': () => { o.remove(); App.kiPanel(true); setTimeout(() => KI.modellMenue(), 200); },
      'ordner-schreiben': () => Werkzeuge.ordnerSchreiben(),
      'ordner-lesen': () => { o.remove(); Werkzeuge.ordnerLesen(); },
      'dateien-lesen': () => { o.remove(); Werkzeuge.dateienLesen(); },
      'einzeldatei': () => Werkzeuge.einzelDatei(),
      'export-json': () => App.sicherungSpeichern(),
      /* --- Die automatische Sicherung in einen Ordner (E270) -----------
         `waehlen` bekommt die Zusage-Frage als Angabe gereicht, statt
         selbst ein `confirm` zu bauen — so nimmt die Oberfläche ihren
         eigenen Dialog (E29) und ein Prüflauf kann sie setzen. */
      'ordner-sicherung-an': async () => {
        const os = (globalThis as any).OrdnerSicherung;
        if (!os) return;
        const erg = await os.waehlen((frage: string) => Dialog.wahl({
          titel: 'Automatisch in diesen Ordner sichern?',
          text: frage,
          knoepfe: [
            { id: 'ja', text: 'Ja, ab jetzt automatisch sichern',
              hinweis: 'Alle fünf Minuten, aber nur wenn sich etwas geändert hat' },
            { id: '', text: 'Abbrechen',
              hinweis: 'Es wird kein Ordner gemerkt und nichts geschrieben' }
          ]
        }).then((w: string) => w === 'ja'));
        (o as HTMLElement & { neuZeichnen?: () => void }).neuZeichnen?.();
        if (erg.ok) UI.toast('Redion sichert ab jetzt nach „' + erg.name + '"');
        else if (erg.grund) UI.banner(erg.grund, 'fehler');
      },
      'ordner-sicherung-jetzt': async () => {
        const os = (globalThis as any).OrdnerSicherung;
        if (!os) return;
        UI.toast('Sicherung wird geschrieben …');
        await os.jetztSichern(true);
        (o as HTMLElement & { neuZeichnen?: () => void }).neuZeichnen?.();
      },
      'ordner-sicherung-aus': async () => {
        const os = (globalThis as any).OrdnerSicherung;
        if (!os) return;
        /* Was im Ordner liegt, bleibt liegen — und das muss dastehen,
           sonst rechnet jemand mit dem Gegenteil. */
        const w = await Dialog.wahl({
          titel: 'Automatische Sicherung abschalten?',
          text: 'Redion sichert dann nicht mehr von selbst in „' + os.name() + '".',
          knoepfe: [
            { id: 'aus', text: 'Abschalten',
              hinweis: 'Was schon im Ordner liegt, bleibt unangetastet liegen' },
            { id: '', text: 'Abbrechen', hinweis: 'Es bleibt, wie es ist' }
          ]
        });
        if (w !== 'aus') return;
        os.loesen();
        (o as HTMLElement & { neuZeichnen?: () => void }).neuZeichnen?.();
        UI.toast('Automatische Sicherung abgeschaltet');
      },
      'import-json': () => App.sicherungLaden(() => o.remove()),
      'seite-md': () => seite && App.markdownExport(seite),
      'seite-html': () => seite && Werkzeuge.htmlExport(seite),
      'seite-pdf': () => { o.remove(); if (seite) Werkzeuge.drucken(seite); },
      'seite-sperren': () => { o.remove(); if (seite) Werkzeuge.sperren(seite); },
      /* Der Weg zum vorhandenen Wolke-Fenster — dasselbe Muster, mit dem
         es das Mehr-Blatt schon öffnet (E251). Kein zweiter Dialog (E29),
         und kein Import: der Bereich greift über den globalen Namen (§5). */
      'wolke-oeffnen': () => {
        o.remove();
        const wf = (globalThis as any).WolkeFenster;
        if (wf?.dialog) wf.dialog();
        else UI.toast('Die Wolke ist in dieser Fassung nicht geladen.');
      },
      'seite-schreibschutz': () => {
        if (!seite) return;
        Store.updateBlock(seite.id, { gesperrt: !seite.gesperrt });
        App.zeichneSeite();
        UI.toast(seite.gesperrt ? 'Bearbeiten wieder erlaubt' : 'Seite gegen Bearbeiten gesperrt');
      },
      'papierkorb': () => { o.remove(); App.papierkorb(); },
      'kuerzel': () => { o.remove(); Werkzeuge.tastenkuerzel(); },
      'formelbib': () => { o.remove(); Werkzeuge.formelBibliothek(); },
      'startseite-waehlen': () => {
        o.remove();
        Blocks.seitenPicker('Welche Seite soll die Startseite sein?', (id: string) => {
          Store.setMeta('startSeite', id);
          Store.setMeta('startAnsicht', 'seite');
          UI.toast('Startseite gesetzt');
        });
      },
      'bereich-neu': async () => {
        const name = await UI.frage('Name des Bereichs', 'Arbeit');
        if (!name) return;
        const icon = await UI.frage('Ein Symbol dafür', '💼');
        const liste = V('bereiche', []) || [];
        liste.push({ id: Store.uid().slice(0, 6), name, icon: icon || '📁' });
        S('bereiche', liste);
        App.zeichneBaum();
        o.neuZeichnen();
      },
      'bereich-zuordnen': () => {
        const liste = V('bereiche', []) || [];
        if (!liste.length) { UI.toast('Erst einen Bereich anlegen'); return; }
        o.remove();
        Blocks.seitenPicker('Welche Seite soll zugeordnet werden?', (id: string) => {
          const m = UI.menu('<div class="grp">In welchen Bereich?</div>' +
            liste.map((b: any) => `<button data-b="${b.id}"><span class="mi">${esc(b.icon)}</span>${esc(b.name)}</button>`).join('') +
            '<hr><button data-b="">Keinem Bereich</button>', innerWidth / 2 - 120, 160);
          m.addEventListener('click', e => {
            const b = elVon(e)?.closest<HTMLElement>('button[data-b]');
            if (!b) return;
            Store.updateBlock(id, { bereich: b.dataset.b });
            m.remove(); App.zeichneBaum();
            UI.toast('Zugeordnet');
          });
        });
      },
      /**
       * HIER STAND `v.slice(5)`. Ein Knopf, der ohne Rückfrage fünf Fassungen
       * je Seite behielt und alle übrigen endgültig löschte — bei einer Seite
       * mit dreissig Fassungen also fünfundzwanzig, unwiederbringlich, mit
       * einem Klick. Das war eine dritte Zahl neben `slice(30)` und
       * `VERSIONEN_MAX: 200`, und die schärfste von allen.
       *
       * Jetzt wendet der Knopf dieselbe Regel an wie das Speichern, nur
       * sofort statt beim nächsten Mal: ausdünnen, nicht abschneiden. Und er
       * fragt vorher — mit der Zahl, um die es geht.
       */
      'versionen-aufraeumen': async () => {
        const opfer: any[] = [];
        try {
          for (const p of Links.seiten()) {
            const v = await Store.versionen(p.id);
            Store.fassungenAusduennen(v).forEach(id => opfer.push(id));
          }
        } catch (err) {
          /* Auf halbem Weg abbrechen ist hier richtig: was schon in `opfer`
             steht, ist nur eine Auswahl aus den Seiten, die lesbar waren.
             Danach zu löschen hiesse, nach einem unvollständigen Bild zu
             handeln — und gelöschte Fassungen kommen nicht wieder. */
          UI.toast('Der Verlauf ist gerade nicht lesbar — es wurde nichts gelöscht');
          if (typeof Reporter !== 'undefined')
            Reporter.error('einstellungen', 'Aufräumen abgebrochen: Verlauf nicht lesbar', err);
          return;
        }
        if (!opfer.length) { UI.toast('Der Verlauf ist schon aufgeräumt — nichts zu tun'); return; }
        if (!(await Dialog.bestaetigen({ titel: `${opfer.length} alte Fassungen endgültig löschen?`,
               text: 'Behalten werden die jüngsten, danach eine je Tag und eine je Monat. ' +
                     'Von Hand gesicherte Fassungen bleiben alle.',
               ja: 'Endgültig löschen', gefahr: true }))) return;
        for (const id of opfer) await Store.versionLoeschen(id);
        UI.toast(opfer.length + ' alte Fassungen entfernt');
      },
      'speicher-sichern': async () => {
        if (!navigator.storage?.persist) { UI.toast('Der Browser kann das nicht'); return; }
        const ok = await navigator.storage.persist();
        UI.toast(ok ? 'Der Speicher ist jetzt dauerhaft' : 'Der Browser hat abgelehnt');
      },
      'alles-loeschen': async () => {
        /* Zweimal gefragt, wie bisher — jetzt im Fenster des Kits (E710). */
        if (!(await Dialog.bestaetigen({ titel: 'Wirklich ALLE Seiten und Datenbanken löschen?',
               ja: 'Alles löschen', gefahr: true }))) return;
        if (!(await Dialog.bestaetigen({ titel: 'Ganz sicher?',
               text: 'Am besten vorher eine Sicherung speichern.', ja: 'Ja, alles löschen', gefahr: true }))) return;
        /* Kein Neuladen, wenn es nicht ganz geklappt hat: nach dem Neuladen
           sähe der Bildschirm leer aus, und genau das wäre die Lüge — die
           Daten wären noch da. Lieber stehen bleiben und es sagen. */
        try { await Store.wipe(); }
        catch (err) {
          await Dialog.melden({ titel: 'Es liess sich nicht alles löschen',
            text: err instanceof Error ? err.message : 'Es liess sich nicht alles löschen.' });
          return;
        }
        location.reload();
      }
    };
    const tuIt = (karte as Record<string, () => any>)[was];
    if (tuIt) await tuIt();
  };

  /* ========================================================================
   * WAS BEIM START GILT
   * ======================================================================*/
  const start = () => {
    anwenden();
    if (V('seiteZu', false)) document.getElementById('sidebar')?.classList.add('collapsed');

    /* FÄLLIGE KARTEIKARTEN MELDEN — EINMAL AM TAG, NICHT BEI JEDEM START.
     *
     * Der Schalter dazu gibt es seit jeher („Karteikarten · Beim Start
     * melden"), und er stand auf an. Nur meldete es bei JEDEM Öffnen und
     * bei jedem Neuladen — wer an Redion arbeitet, sah den Streifen
     * vierzigmal am Tag, und wer ihn wegdrücken wollte, musste die
     * ganze Meldung abschalten.
     *
     * Eine Erinnerung, die man schon kennt, ist keine Erinnerung mehr.
     * Also merkt sie sich den TAG, an dem sie gezeigt wurde.
     *
     * Der Merker wird nur gesetzt, wenn wirklich etwas gezeigt wurde. Sonst
     * würde ein Start um 8 Uhr ohne fällige Karten die Meldung um 14 Uhr
     * verschlucken, wenn dann welche fällig sind. */
    /* AUS, BIS ER SIE EINSCHALTET (E409). Die Vorgabe war an, und damit stand
       der Streifen bei jedem ersten Start des Tages unten in der Mitte — auch
       über jedem Bildschirmfoto und über dem, was gerade gebaut wurde. Eine
       Meldung, um die niemand gebeten hat, ist Werbung, keine Erinnerung. */
    if (V('kartenMelden', false)) {
      const heute3 = new Date().toISOString().slice(0, 10);
      if (Store.getMeta('kartenGemeldet', '') !== heute3) {
        const n = Werkzeuge.faellig().length;
        if (n) {
          Store.setMeta('kartenGemeldet', heute3);
          setTimeout(() => UI.toast('🎴 ' + n +
            (n === 1 ? ' Karteikarte ist fällig' : ' Karteikarten sind fällig')), 1800);
        }
      }
    }
  };

  return { oeffne, start, anwenden, datum, wochenstart, V, S, GRUPPEN, BEREICHE };
})();

(window as any).Einstellungen = Einstellungen;
