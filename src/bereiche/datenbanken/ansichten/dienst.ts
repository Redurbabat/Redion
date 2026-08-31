/* ============================================================================
 * apps/tabellen/ansichten/dienst.js — aus notion.js herausgelöst
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/datenbanken/ansichten/dienst.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/datenbanken/ansichten/dienst.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Stammt aus der früheren Sammeldatei notion.js. Der Inhalt ist unverändert;
 * nur der Ort ist jetzt der, an dem man ihn sucht.
 * ==========================================================================*/

const Ansichten = (() => {

  const esc = (s: unknown): string => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /**
   * Zwei Handgriffe, die in dieser Datei elfmal gebraucht werden.
   *
   * `flaeche()` holt die Bühne (`#page`) und die Brotkrume (`#crumb`) — oder
   * nichts, wenn die Schale noch nicht steht. Vorher stand hier
   * `document.getElementById('crumb').innerHTML = …` ohne Nachsehen; das ist
   * derselbe Fund wie in `hinweis.ts`, nur an einer Stelle, die beim Start
   * läuft.
   */
  const flaeche = (): { wrap: HTMLElement; crumb: HTMLElement } | null => {
    const wrap = document.getElementById('page');
    const crumb = document.getElementById('crumb');
    return wrap && crumb ? { wrap, crumb } : null;
  };

  /* ==========================================================================
   * EIN BILDSCHIRM SAGT, WO ER IST (E273)
   * --------------------------------------------------------------------------
   * Sechs Ansichten in dieser Datei — Start, Posteingang, Seiten, Termine,
   * Mehr, Kompass — haben sich früher selbst in `#page` gezeichnet:
   * `flaeche()` holen, `App.setzeSeite(null)`, Krume schreiben, malen.
   *
   * Das ging, solange niemand fragte, WO man ist. Seit E272 fragt die
   * Kontextkante genau das. Und `App.schauplatz()` (schale.ts:698) kennt nur
   * zwei Dinge: eine offene Seite oder ein `sonder`, das `zeigeSonder`
   * gesetzt hat. Wer keins von beidem setzt, ändert den Schauplatz NICHT —
   * er bleibt auf dem letzten stehen.
   *
   * Gemessen war das kein leerer Rand, sondern ein FALSCHER: von „Meine
   * Aufgaben" auf „Start" geklickt, und links standen weiter Tagesplan,
   * Wochenrückblick und Fällig. Von „Notizhefte" auf „Posteingang", und die
   * Kante blieb bei den Notizheften. Sechs Bildschirme logen über ihren Ort.
   *
   * Der Weg dahin führt nicht über einen zweiten Melder, sondern über den,
   * den alle anderen sieben Bildschirme schon nehmen: `App.zeigeSonder`.
   * Es setzt `sonder`, ruft den Zeichner, meldet den Schauplatz und schreibt
   * die Krume aus dem Titel — deshalb steht sie hier nicht mehr in jeder
   * Ansicht, und deshalb sind die Emoji daraus verschwunden (E202).
   *
   * `flaeche()` bleibt: es ist die Probe, ob die Schale überhaupt steht.
   */
  const bildschirm = (titel: string, malen: (wrap: HTMLElement) => void): void => {
    if (!flaeche()) return;
    App.zeigeSonder(titel, malen);
  };

  /** Das angeklickte Element — oder nichts, wenn es kein Element war. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  const gruss = (): string => {
    const h = new Date().getHours();
    const name = Store.getMeta('nutzer', '');
    const teil = h < 5 ? 'Gute Nacht' : h < 11 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend';
    return teil + (name && name !== 'Ich' ? ', ' + name : '');
  };

  /* --------------------------------------------------------------------------
   * SICHERUNGSSTAND auf dem Start-Bildschirm
   * ---------------------------------------------------------------------------
   * Der Zeitstempel lag bisher im Verschlüsselungs-Dialog, drei Klicks tief in
   * den Einstellungen. Dort sieht ihn, wer ohnehin ans Sichern denkt. Wer
   * nicht daran denkt — und das ist der Fall, für den die Anzeige da ist —
   * kommt nie dorthin. Also steht er jetzt da, wo man jeden Morgen hinschaut.
   *
   * Abgestuft, und das ist der eigentliche Punkt. Eine Warnung, die immer
   * gleich laut ist, wird zur Tapete. Frisch gesichert heisst deshalb: eine
   * ruhige Zeile. Länger her heisst: ein Hinweis mit Knopf. Nie gesichert
   * heisst: ein Hinweis, den man nicht überliest. Die Stelle auf der Seite
   * bleibt in allen drei Fällen dieselbe, damit nichts springt.
   * ------------------------------------------------------------------------ */

  /* Hier standen `TAG`, `SICHERUNG_ERINNERN` und `SICHERUNG_WARNEN`. Sie sind
     mit der Rechnung in den Kern gezogen (E208) — hier stehenzulassen hiesse,
     zwei Zahlenpaare zu pflegen, von denen nur eines wirkt. Wer die Fristen
     ändern will, ändert sie in `kern/helfer/sicherung.ts`. */

  type Sicherungsstand = {
    stufe: 'gut' | 'erinnern' | 'warnen';
    tage: number | null;
    art: string;
    wann: string;
  };

  /* DIE RECHNUNG STEHT IM KERN (E208).
     Hier stand sie ausgeschrieben, und die Bibliothek brauchte sie auch —
     ein Bereich darf aber nicht aus einem anderen importieren (§5, Regel 1).
     Abschreiben wäre hier schlimmer als anderswo: bei einem Anriss fällt es
     auf, wenn zwei Fassungen auseinanderlaufen, bei einer FRIST nicht. Eine
     Ansicht, die „gesichert" sagt, während die andere warnt, ist genau die
     Sorte Fehler, die §46 meint.

     `SICHERUNG_ERINNERN` und `SICHERUNG_WARNEN` stehen weiter unten noch als
     Zahlen — sie sind jetzt eine Kopie der Kernwerte, und deshalb liest der
     Text unten sie auch nicht mehr; er nimmt die Stufe. */
  const sicherungsstand = (): Sicherungsstand => Sicherung.stand();

  const sicherungBand = (): string => {
    const s = sicherungsstand();
    const wieLang = s.tage === null ? ''
      : s.tage === 0 ? 'heute'
      : s.tage === 1 ? 'gestern'
      : 'vor ' + s.tage + ' Tagen';

    if (s.stufe === 'gut') {
      /* Alles in Ordnung: eine Zeile, kein Kasten, kein Ausrufezeichen. */
      const ohneAnhaenge = s.art === 'json'
        ? ' · JSON-Sicherung, ohne Anhänge' : '';
      return '<div class="home-sich home-sich-gut">' +
        `<span class="hs-zeichen">✓</span>` +
        `<span class="hs-text">Gesichert ${esc(wieLang)}` +
        `<em>${esc(Werkzeuge.zeitKurz(s.wann))}${esc(ohneAnhaenge)}</em></span>` +
        '<button class="hs-still" data-a="sichern">Sichern</button>' +
        '</div>';
    }

    const nie = s.tage === null;
    return `<div class="home-sich home-sich-${s.stufe}">` +
      `<span class="hs-zeichen">${nie ? '!' : '⏳'}</span>` +
      '<span class="hs-text">' +
        `<b>${nie ? 'Noch nie gesichert' : 'Zuletzt gesichert ' + esc(wieLang)}</b>` +
        `<em>${nie
          ? 'Deine Seiten liegen nur in diesem Browser. Eine Sicherung ist eine Datei auf deinem Gerät.'
          : 'Was seitdem entstanden ist, liegt nur in diesem Browser.'}</em>` +
      '</span>' +
      '<button class="hs-tun prim" data-a="sichern">Jetzt sichern</button>' +
      '</div>';
  };

  /* --------------------------------------------------------------------------
   * PRIVAT — die eigenen Seiten auf oberster Ebene
   * ---------------------------------------------------------------------------
   * „Zuletzt bearbeitet" beantwortet: woran war ich dran? Diese Liste
   * beantwortet: was habe ich überhaupt? Das ist auf dem Handy die
   * wichtigere Frage, weil es dort keine Seitenleiste mit dem Baum gibt.
   * ------------------------------------------------------------------------ */
  const PRIVAT_MAX = 8;

  const privatListe = (): string => {
    const alle = Store.rootPages().filter((p: any) => !p.system);
    const wurzeln = alle.slice(0, PRIVAT_MAX);
    if (!wurzeln.length) return '';
    const mehr = alle.length - wurzeln.length;
    return '<h2>Privat</h2><div class="home-liste">' +
      wurzeln.map((p: any) => {
        const kinder = Store.childrenOf(p.id)
          .filter((k: any) => k.type === 'page' && k.alive).length;
        return `<button data-open="${esc(p.id)}"><span>${esc(p.icon || '📄')}</span>` +
          `<span style="flex:1">${esc(p.text || 'Ohne Titel')}</span>` +
          `<span class="pth">${kinder ? kinder + (kinder === 1 ? ' Unterseite' : ' Unterseiten') : ''}</span>` +
          '</button>';
      }).join('') +
      (mehr > 0 ? `<div class="leer">und ${mehr} weitere in der Seitenleiste</div>` : '') +
      '</div>';
  };

  /* --------------------------------------------------------------------------
   * SCHNELLZUGRIFF — was der Nutzer selbst nach oben gestellt hat
   * ---------------------------------------------------------------------------
   * Der Wunsch war: „Ausbildung" und „Mediathek" als eigene Kacheln auf dem
   * Start-Bildschirm. Zwei feste Kacheln einzubauen wäre die kurze Antwort —
   * und die falsche: der Nächste braucht „Rezepte" und „Trainingsplan", und
   * dann stehen vier Kacheln da, die niemand bestellt hat.
   *
   * Redion kennt bereits einen Begriff dafür, dass etwas wichtig ist: den
   * Stern. Wer eine Seite mit ★ markiert, stellt sie damit nach oben — in der
   * Seitenleiste und ab jetzt auch hier. Kein zweites Anheften, kein
   * Einstellungsdialog, keine Liste, die man doppelt pflegt.
   *
   * Vier Stück, mehr nicht. Der Schnellzugriff soll der erste Blick sein,
   * nicht das Inhaltsverzeichnis; alles Weitere steht in der Seitenleiste.
   * ------------------------------------------------------------------------ */
  const SCHNELL_MAX = 4;

  const schnellKarten = (): string => {
    const sterne = Links.seiten()
      .filter((p: any) => p.favorite && !p.system)
      .sort((a: any, b: any) => (b.edited || '').localeCompare(a.edited || ''))
      .slice(0, SCHNELL_MAX);
    if (!sterne.length) return '';
    return '<h2>Schnellzugriff</h2><div class="home-karten">' +
      sterne.map((p: any) => {
        const kinder = Store.childrenOf(p.id)
          .filter((k: any) => k.type === 'page' && k.alive).length;
        const unten = kinder
          ? kinder + (kinder === 1 ? ' Unterseite' : ' Unterseiten')
          : Werkzeuge.zeitKurz(p.edited);
        return `<button class="hk" data-open="${esc(p.id)}">` +
          `<b>${esc(p.icon || '📄')} ${esc(p.text || 'Ohne Titel')}</b>` +
          `<span>${esc(unten)}</span></button>`;
      }).join('') +
      '</div>';
  };

  const start = (): void => bildschirm('Start', (wrap: HTMLElement) => {

    const zuletzt = Object.values<any>(Store.cache.blocks)
      .filter(b => b.type === 'page' && b.alive && b.parentTable !== 'collection' && !b.system)
      .sort((a, b) => (b.edited || '').localeCompare(a.edited || '')).slice(0, 6);

    const offen = Werkzeuge.erinnerungen().filter((e: any) => !e.erledigt);
    const karten = Werkzeuge.faellig().length;
    const journalHeute = Store.getMeta('sys:journal') &&
      Store.childrenOf(Store.getMeta('sys:journal')).some((k: any) => (k.text || '').startsWith(new Date().toISOString().slice(0, 10)));

    wrap.className = '';
    wrap.innerHTML =
      `<div class="home">` +
        `<h1>${esc(gruss())}</h1>` +
        '<div class="home-karten">' +
          `<button class="hk" data-a="journal"><b>📅 Tagesjournal</b>` +
            `<span>${journalHeute ? 'Heutiger Eintrag ist angelegt' : 'Heutigen Eintrag anlegen'}</span></button>` +
          `<button class="hk" data-a="memo"><b>⚡ Schnellnotiz</b><span>Gedanken sofort festhalten</span></button>` +
          `<button class="hk" data-a="lernen"><b>🎴 Karteikarten</b>` +
            /* „1 Karten fällig" stand hier, seit es die Karte gibt. */
            `<span>${karten ? karten + (karten === 1 ? ' Karte fällig' : ' Karten fällig')
                            : 'Keine Karten fällig'}</span></button>` +
          `<button class="hk" data-a="graph"><b>🕸 Graph</b><span>Wie alles zusammenhängt</span></button>` +
        '</div>' +

        sicherungBand() +
        schnellKarten() +

        '<h2>Zuletzt bearbeitet</h2>' +
        '<div class="home-liste">' +
          (zuletzt.length ? zuletzt.map((p: any) =>
            `<button data-open="${p.id}"><span>${esc(p.icon || '📄')}</span>` +
            `<span style="flex:1">${esc(p.text || 'Ohne Titel')}</span>` +
            `<span class="pth">${esc(Werkzeuge.zeitKurz(p.edited))}</span></button>`).join('')
          : '<div class="leer">Noch keine Seiten</div>') +
        '</div>' +

        (offen.length
          ? '<h2>Anstehende Erinnerungen</h2><div class="home-liste">' +
            offen.sort((a: any, b: any) => a.zeit.localeCompare(b.zeit)).slice(0, 5).map((e: any) =>
              `<button data-open="${e.pageId}"><span>⏰</span><span style="flex:1">${esc(e.text)}</span>` +
              `<span class="pth">${esc(new Date(e.zeit).toLocaleString('de-DE'))}</span></button>`).join('') +
            '</div>'
          : '') +

        privatListe() +

        `<h2>Dein Arbeitsbereich</h2>` +
        `<div class="home-zahlen">` +
          zahl(Links.seiten().length, 'Seiten') +
          zahl(Object.keys(Store.cache.collections).length, 'Datenbanken') +
          zahl(Links.alleTags().length, 'Schlagwörter') +
          zahl(Werkzeuge.karten().length, 'Karteikarten') +
        `</div>` +
      '</div>';

    /* `onclick =`, NICHT `addEventListener`. Der Unterschied ist hier kein
       Geschmack, sondern ein gefundener Fehler (E57).

       `wrap` ist `#page` und bleibt stehen; nur sein Inhalt wird neu
       geschrieben. Mit `addEventListener` kam bei jedem Zeichnen ein
       weiterer Zuhörer dazu — und `start()` läuft bei jeder Rückkehr zum
       Start-Bildschirm. Nach dem dritten Mal legte ein Klick auf
       „Tagesjournal" drei Journale an, und ein Klick auf „Jetzt sichern"
       startete drei Sicherungen nacheinander, bei Anhängen also dreimal
       durch alle Dateien.

       Gefunden hat das die Prüfung zum Sicherungsknopf: sie zählte zwei
       Klicks und bekam drei Aufrufe. Die vier anderen Ansichten in dieser
       Datei machten es von Anfang an richtig. */
    wrap.onclick = (e: Event) => {
      const ziel = elVon(e);
      const o = ziel?.closest<HTMLElement>('[data-open]');
      if (o) { App.oeffne(o.dataset['open']); return; }
      const a = ziel?.closest<HTMLElement>('[data-a]');
      if (!a) return;
      if (a.dataset['a'] === 'journal') Werkzeuge.journal();
      if (a.dataset['a'] === 'memo') Werkzeuge.schnellnotizen();
      if (a.dataset['a'] === 'lernen') Werkzeuge.lernen();
      if (a.dataset['a'] === 'graph') Links.graph();
      /* DER KNOPF IM SICHERUNGSBAND — und was er dabei erzählt (E57).
         Derselbe Weg wie in den Einstellungen; neu ist, was dazwischen
         zu sehen ist.

         Eine `.redion`-Sicherung mit Anhängen dauert Sekunden bis Minuten.
         Bis hierher passierte in dieser Zeit auf der Karte NICHTS: der
         Knopf blieb, wie er war, und irgendwann kam ein Toast. Am Telefon
         steht der Toast über der Aktionsleiste und ist nach 2,6 Sekunden
         weg — wer in dem Moment wegsieht, weiss nicht, ob überhaupt etwas
         geschieht, und tippt ein zweites Mal.

         Also sagt es der Knopf selbst: erst „Sichern …" mit einem Kreisel,
         dann ein Haken, dann die neu gezeichnete Karte mit „Gesichert
         heute". Drei Zustände, und der mittlere ist der, den man sonst
         verpasst. */
      if (a.dataset['a'] === 'sichern') {
        const knopf = a as HTMLButtonElement;
        const wieVorher = knopf.innerHTML;
        knopf.disabled = true;
        knopf.classList.add('laeuft');
        knopf.innerHTML = '<i class="hs-kreisel" aria-hidden="true"></i>Sichern …';
        /* Was das Vorleseprogramm hört. Ein Kreisel ist für es nichts. */
        knopf.setAttribute('aria-live', 'polite');

        const fertig = (gut: boolean) => {
          if (!knopf.isConnected) return;
          knopf.classList.remove('laeuft');
          knopf.classList.toggle('fertig', gut);
          knopf.innerHTML = gut ? '✓ Gesichert' : 'Nicht gesichert';
          /* Den Haken kurz stehen lassen. Sofort neu zu zeichnen hiesse:
             der Knopf blinkt einmal und die Karte sieht aus wie vorher —
             man hätte nichts gesehen. */
          setTimeout(() => {
            if (document.getElementById('page')?.querySelector('.home-sich')) start();
            else if (knopf.isConnected) {
              knopf.disabled = false;
              knopf.classList.remove('fertig');
              knopf.innerHTML = wieVorher;
            }
          }, 1200);
        };

        /* `sicherungSpeichern` fängt seine Fehler selbst und kehrt regulär
           zurück — deshalb reicht `.then(() => fertig(true))` nicht, der
           Haken erschien auch nach dem „Es wurde nichts geschrieben"-Alert.
           Nur ein ausdrückliches `false` ist ein Fehlschlag; `undefined`
           (etwa aus einem Prüf-Stellvertreter) zählt weiter als Erfolg. */
        void Promise.resolve(App.sicherungSpeichern())
          .then((gut: unknown) => fertig(gut !== false))
          /* Auch der Fehlschlag gehört auf den Knopf. Ein Kreisel, der
             ewig dreht, ist die schlechteste aller Auskünfte. */
          .catch(() => fertig(false));
      }
    };
  });

  const zahl = (n: number, name: string): string =>
    `<div class="hz"><b>${n}</b><span>${name}</span></div>`;

  const posteingang = (): void => bildschirm('Posteingang', (wrap: HTMLElement) => {
    const erinner = Werkzeuge.erinnerungen();
    const meld = Werkzeuge.meldungen();
    const kommentare: any[] = [];
    Links.seiten().forEach((p: any) =>
      Kommentare.alle(p.id).forEach((k: any) => kommentare.push({ seite: p, ...k })));
    /* Was direkt an mich gerichtet ist — @Name in einem offenen Kommentar */
    const anMich = Kommentare.anMich();
    const geaendert = Object.values<any>(Store.cache.blocks)
      .filter(b => b.type === 'page' && b.alive && b.parentTable !== 'collection')
      .sort((a, b) => (b.edited || '').localeCompare(a.edited || '')).slice(0, 8);

    wrap.className = '';
    const nichts = !erinner.length && !kommentare.length && !meld.length && !anMich.length;

    wrap.innerHTML =
      '<div class="home">' +
        '<h1>📥 Posteingang</h1>' +
        (nichts
          ? Hinweis.leer({
              zeichen: '☑',
              gross: 'Du bist auf dem neuesten Stand!',
              klein: 'Bei @-Erwähnungen, Kommentaren und Erinnerungen ' +
                     'wirst du hier benachrichtigt',
              handlung: 'Filter ändern',
              daten: 'data-filter="1"'
            })
          : '') +
        /* Direkt an mich gerichtet — steht ganz oben, wie in Notion */
        (anMich.length
          ? '<h2>An dich gerichtet</h2><div class="home-liste">' +
            anMich.map((m: any) =>
              /* NICHT `data-open` MIT `parentId` (E275, L98).
                 Gemessen: bei einem verschachtelten Block ist `parentId`
                 der ELTERNBLOCK, und `App.oeffne` zeichnete ihn dann wie
                 eine Seite — Krume „Skript / Kapitel 4", Inhalt der Toggle
                 statt der Seite. Es führte also nicht ins Leere, aber an
                 einen Ort, den es als Seite nicht gibt.

                 `App.zeigeBlock` kann das seit E105 richtig: es sucht die
                 echte Seite, öffnet sie und rollt zum Block. `data-komm`
                 stand daneben und wurde nirgends gelesen — die Kennung des
                 Blocks ist das, worauf es ankommt. */
              `<button data-block="${m.block.id}">` +
              '<span>@</span>' +
              `<span style="flex:1">${esc(m.k.text)}` +
              `<em style="opacity:.6"> — ${esc(m.k.autor || 'jemand')}</em></span>` +
              `<span style="opacity:.5">${Werkzeuge.zeitKurz(m.k.zeit)}</span></button>`).join('') +
            '</div>'
          : '') +
        /* Was Automationen gemeldet haben — Notions „Send notification to" */
        (meld.length
          ? '<h2>Benachrichtigungen</h2><div class="home-liste">' +
            meld.slice(0, 30).map((m: any) =>
              `<button data-meld="${m.id}"${m.seite ? ` data-open="${m.seite}"` : ''}>` +
              `<span>${m.gelesen ? '🔕' : '🔔'}</span>` +
              `<span style="flex:1">${esc(m.text)}` +
              (m.quelle ? `<em style="opacity:.6"> — ${esc(m.quelle)}</em>` : '') + '</span>' +
              `<span style="opacity:.5">${Werkzeuge.zeitKurz(m.wann)}</span></button>`).join('') +
            '</div>'
          : '') +
        '<h2>Erinnerungen</h2><div class="home-liste">' +
          (erinner.length ? erinner.slice().sort((a: any, b: any) => b.zeit.localeCompare(a.zeit)).map((e: any) =>
            `<button data-open="${e.pageId}"><span>${e.erledigt ? '✅' : '⏰'}</span>` +
            `<span style="flex:1">${esc(e.text)}</span>` +
            `<span class="pth">${esc(new Date(e.zeit).toLocaleString('de-DE'))}</span></button>`).join('')
          : '<div class="leer">Keine Erinnerungen</div>') +
        '</div>' +
        '<h2>Kommentare</h2><div class="home-liste">' +
          (kommentare.length ? kommentare.slice(0, 12).map((k: any) =>
            `<button data-open="${k.seite.id}"><span>${k.k.erledigt ? '✅' : '💬'}</span>` +
            `<span style="flex:1">${esc(k.k.text)}<span class="snip">${esc(k.seite.text || 'Ohne Titel')}</span></span>` +
            `<span class="pth">${esc(Werkzeuge.zeitKurz(k.k.zeit))}</span></button>`).join('')
          : '<div class="leer">Keine Kommentare</div>') +
        '</div>' +
        '<h2>Zuletzt geändert</h2><div class="home-liste">' +
          geaendert.map((p: any) =>
            `<button data-open="${p.id}"><span>${esc(p.icon || '📄')}</span>` +
            `<span style="flex:1">${esc(p.text || 'Ohne Titel')}</span>` +
            `<span class="pth">${esc(Werkzeuge.zeitKurz(p.edited))}</span></button>`).join('') +
        '</div>' +
      '</div>';

    /* `onclick =` — siehe die Begründung bei `start()`. */
    wrap.onclick = (e: Event) => {
      const ziel = elVon(e);
      /* Eine Benachrichtigung gilt als gelesen, sobald man sie antippt */
      const m = ziel?.closest<HTMLElement>('[data-meld]');
      if (m && m.dataset['meld']) Werkzeuge.meldungGelesen(m.dataset['meld']);
      /* VOR `data-open`: ein Blocksprung ist kein Seitenaufruf. */
      const bl = ziel?.closest<HTMLElement>('[data-block]');
      if (bl?.dataset['block']) { App.zeigeBlock(bl.dataset['block']); return; }
      const o = ziel?.closest<HTMLElement>('[data-open]');
      if (o) { App.oeffne(o.dataset['open']); return; }
      if (m) { posteingang(); return; }
      if (ziel?.closest('[data-filter]')) posteingangFilter(ziel);
    };
  });

  /** Was soll im Posteingang auftauchen? */
  const posteingangFilter = (anker: Element): void => {
    const jetzt: Record<string, boolean> = Store.getMeta('posteingangFilter',
      { erinnerungen: true, kommentare: true, geaendert: true });
    const r = anker.getBoundingClientRect();
    const m = UI.menu('<div class="grp">Im Posteingang zeigen</div>' +
      ([['erinnerungen', '⏰ Erinnerungen'], ['kommentare', '💬 Kommentare'],
        ['geaendert', '📄 Zuletzt geändert']] as [string, string][])
        .map(([id, n]) => `<button data-x="${id}">${n}` +
          `<span class="ms">${jetzt[id] === false ? 'aus' : 'an'}</span></button>`).join(''),
      r.left, r.bottom + 6, { titel: 'Filter' });
    m.addEventListener('click', (e: MouseEvent) => {
      const b = elVon(e)?.closest<HTMLElement>('[data-x]');
      const x = b?.dataset['x'];
      if (!x) return;
      jetzt[x] = jetzt[x] === false;
      Store.setMeta('posteingangFilter', jetzt);
      m.remove();
      posteingang();
    });
  };

  /* ==========================================================================
   * DER SEITEN-BEREICH  (E38)
   * --------------------------------------------------------------------------
   * Hier stand am Telefon einmal „Chats". Redion ist aber keine Chat-App:
   * die KI ist ein Werkzeug, kein Hauptbereich. Sie bleibt unten in der
   * Leiste („KI fragen") und im R-Blatt erreichbar — der Platz oben gehört
   * dem, was man täglich sucht.
   *
   * Fünf Abschnitte, und jeder erscheint nur, wenn er etwas enthält. Ein
   * leerer Abschnitt mit Überschrift ist eine Behauptung ohne Inhalt; er
   * kostet Platz und sagt nichts.
   * ========================================================================*/
  const seiten = (): void => bildschirm('Seiten', (wrap: HTMLElement) => {

    const alle = Object.values<any>(Store.cache.blocks)
      .filter(b => b.type === 'page' && b.alive && b.parentTable !== 'collection' && !b.system);

    const kuerzlich = [...alle]
      .sort((a, b) => (b.edited || '').localeCompare(a.edited || '')).slice(0, 6);
    const sterne = alle.filter(b => b.fav);
    const privat = alle.filter(b => !b.parentId);
    const datenbanken = Object.values<any>(Store.cache.collections || {});
    const vorlagen = (() => {
      try { return (Register.vorlagen?.alle?.() || []).slice(0, 6); } catch { return []; }
    })();

    const zeit = (p: any) => {
      const d = p.edited ? new Date(p.edited) : null;
      if (!d || isNaN(d.getTime())) return '';
      const heute = new Date(); heute.setHours(0, 0, 0, 0);
      return d.getTime() >= heute.getTime()
        ? 'Heute ' + d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
        : d.toLocaleDateString('de-CH', { day: '2-digit', month: 'short' });
    };
    const zeile = (p: any, rechts = '') =>
      `<button data-open="${esc(p.id)}"><span>${esc(p.icon || '📄')}</span>` +
      `<span class="pt">${esc(p.text || 'Ohne Titel')}</span>` +
      (rechts ? `<span class="pth">${esc(rechts)}</span>` : '') + '</button>';
    const block = (titel: string, inhalt: string) =>
      inhalt ? `<h2>${esc(titel)}</h2><div class="home-liste">${inhalt}</div>` : '';

    wrap.className = '';
    wrap.innerHTML =
      '<div class="home">' +
        '<h1>Seiten</h1>' +
        '<div class="home-karten">' +
          '<button class="hk" data-a="neu"><b>✚ Neue Seite</b>' +
            '<span>Leere Seite anlegen</span></button>' +
          '<button class="hk" data-a="memo"><b>⚡ Schnellnotiz</b>' +
            '<span>Gedanken sofort festhalten</span></button>' +
        '</div>' +
        /* LEERER ZUSTAND (Vorgabe §13). „Noch keine Seiten" allein ist eine
           Feststellung; erst die zwei Knöpfe daneben machen daraus einen
           Weg. Der zweite ist wichtiger, als er aussieht: wer gerade das
           Gerät gewechselt hat, will nicht anfangen, sondern zurückholen. */
        (alle.length ? '' :
          '<div class="leer-zustand"><div class="lz-zeichen">📄</div>' +
          '<b>Noch keine Seiten</b>' +
          '<span>Erstelle deine erste Seite — oder hole eine Sicherung zurück, ' +
          'wenn du von einem anderen Gerät kommst.</span>' +
          '<div class="lz-knoepfe"><button data-a="neu" class="prim">Neue Seite</button>' +
          '<button data-a="import">Importieren</button></div></div>') +
        block('Kürzlich verwendet', kuerzlich.map(p => zeile(p, zeit(p))).join('')) +
        block('Favoriten', sterne.map(p => zeile(p)).join('')) +
        block('Privat', privat.map(p =>
          zeile(p, (() => {
            const n = (p.content || []).filter((k: string) => {
              const kind = Store.getBlock(k);
              return kind && kind.type === 'page' && kind.alive;
            }).length;
            return n ? n + (n === 1 ? ' Unterseite' : ' Unterseiten') : '';
          })())).join('')) +
        block('Datenbanken', datenbanken.map((c: any) =>
          `<button data-db="${esc(c.id)}"><span>${esc(c.icon || '📊')}</span>` +
          `<span class="pt">${esc(c.name || 'Ohne Namen')}</span>` +
          `<span class="pth">${(Store.rowsOf(c.id) || []).length} Zeilen</span></button>`).join('')) +
        block('Vorlagen', vorlagen.map((v: any) =>
          `<button data-vorlage="${esc(v.id || v.name)}"><span>${esc(v.icon || '🧩')}</span>` +
          `<span class="pt">${esc(v.name || v.titel || 'Vorlage')}</span></button>`).join('')) +
        '<div class="home-liste" style="margin-top:22px">' +
          '<button data-a="papierkorb"><span>🗑</span><span class="pt">Papierkorb</span></button>' +
        '</div>' +
      '</div>';

    wrap.onclick = (e: Event) => {
      const el = (e.target instanceof Element) ? e.target : null;
      const auf = el?.closest<HTMLElement>('[data-open]');
      if (auf?.dataset.open) { App.oeffne(auf.dataset.open); return; }
      const db = el?.closest<HTMLElement>('[data-db]');
      if (db?.dataset.db) {
        /* Eine Sammlung selbst ist keine Seite — geöffnet wird der Block,
           der sie zeigt. Findet sich keiner, bleibt die Ansicht stehen,
           statt in eine leere Seite zu springen. */
        const traeger = Object.values<any>(Store.cache.blocks)
          .find(b => b && b.collectionId === db.dataset.db && b.alive);
        if (traeger) App.oeffne(traeger.parentId || traeger.id);
        return;
      }
      const a = el?.closest<HTMLElement>('[data-a]');
      if (!a) return;
      if (a.dataset.a === 'neu')        App.neueSeite();
      else if (a.dataset.a === 'memo')  Werkzeuge.schnellnotizen();
      else if (a.dataset.a === 'import') Werkzeuge.dateienLesen();
      else if (a.dataset.a === 'papierkorb') App.papierkorb();
    };
  });

  /* ========================================================================
   * TERMINE — der dritte Bereich am Telefon
   * ------------------------------------------------------------------------
   * VORHER ÖFFNETE DIESER REITER DIE SCHUBLADE, also die Seitenleiste des
   * Rechners auf 390 px geschoben — genau das, was das R-Blatt für den
   * Kreis links oben abgeschafft hat (E38). Gemessen am 6. August: die
   * Zeilen kamen zwar aus `Meeting.seitenleiste`, standen aber in einem
   * Behälter, der für 260 px Breite und einen Mauszeiger gebaut ist.
   *
   * Jetzt dieselben Angaben auf der Bühne, in Fingerzeilen: was ansteht,
   * und was aus Besprechungen entstanden ist.
   *
   * Die Daten kommen über `App` und `Store` — kein Bereich greift in einen
   * anderen hinein (Architekturregel 1). `Kalender` und `Meeting` werden
   * nur angetippt, wenn es sie gibt; fehlt eines, fehlt die Zeile und nicht
   * die Ansicht.
   * ========================================================================*/
  const termine = (): void => bildschirm('Termine', (wrap: HTMLElement) => {

    const kommend = (() => {
      try { return App.kommendeTermine(12) || []; } catch { return []; }
    })();
    const notizen = Object.values<any>(Store.cache.blocks)
      .filter(b => b.type === 'page' && b.alive !== false && b.besprechung)
      .sort((a, b) => String(b.created).localeCompare(String(a.created)))
      .slice(0, 8);

    const block = (titel: string, inhalt: string) =>
      inhalt ? `<h2>${esc(titel)}</h2><div class="home-liste">${inhalt}</div>` : '';

    wrap.className = '';
    wrap.innerHTML =
      '<div class="home">' +
        '<h1>Termine</h1>' +
        '<div class="home-karten">' +
          '<button class="hk" data-a="kal"><b>📅 Kalender</b>' +
            '<span>Termine hereinholen</span></button>' +
          '<button class="hk" data-a="mtg"><b>🎙 Besprechung</b>' +
            '<span>Mitreden statt mitschreiben</span></button>' +
        '</div>' +
        block('Bevorstehend', kommend.map((t: any) =>
          `<button data-open="${esc(t.id)}"><span>📌</span>` +
          `<span class="pt">${esc(t.text)}</span>` +
          `<span class="pth">${esc(t.wann)}</span></button>`).join('')) +
        /* Steht nichts an, sagt die Ansicht das — und daneben den einen
           Weg, der etwas ändert. Eine leere Liste ohne Ausweg ist eine
           Sackgasse. */
        (kommend.length ? '' :
          '<h2>Bevorstehend</h2><div class="home-liste">' +
          '<button data-a="kal"><span>📅</span><span class="pt">Kalender verbinden</span>' +
          '</button>' +
          '<div class="leer">Dann stehen hier alle Termine der nächsten ' +
          'dreissig Tage, und zu jedem kannst du eine Notiz anlegen.</div></div>') +
        block('Aus Besprechungen', notizen.map(p =>
          `<button data-open="${esc(p.id)}"><span>${esc(p.icon || '🎙')}</span>` +
          `<span class="pt">${esc(p.text || 'Ohne Titel')}</span></button>`).join('')) +
      '</div>';

    wrap.onclick = (e: Event) => {
      const el = (e.target instanceof Element) ? e.target : null;
      const auf = el?.closest<HTMLElement>('[data-open]');
      if (auf?.dataset.open) { App.oeffne(auf.dataset.open); return; }
      const a = el?.closest<HTMLElement>('[data-a]');
      if (!a) return;
      if (a.dataset.a === 'kal')      (window as any).Kalender?.dialog?.();
      else if (a.dataset.a === 'mtg') (window as any).Meeting?.panel?.();
    };
  });

  /* ========================================================================
   * MEHR — die Werkzeuge, geordnet und mit einem Satz dazu
   * ------------------------------------------------------------------------
   * Aus Redurs Entwurf „Nocturne" (E42). Bisher lagen diese Wege im R-Blatt
   * als nackte Liste: „Importieren", „Sichern", „Papierkorb". Wer nicht
   * schon wusste, was dahintersteckt, erfuhr es dort nicht.
   *
   * Drei Gruppen, und jede Zeile sagt in einem Satz, wofür sie da ist. Das
   * ist der ganze Unterschied zwischen einer Liste und einem Wegweiser.
   * ======================================================================*/
  const mehrGruppen = () => [
    /* DIE ZWEI WEGE, DIE UNTEN KEINEN PLATZ MEHR HABEN (E236).
       Die Navigation hat seit E236 fünf Wege statt sechs — und aus dem
       R-Kreis links oben wurde ein Knopf in der Menüleiste. „Workspace"
       und „Arbeitsbereich wechseln" hatten damit keinen Ort mehr.

       Sie stehen deshalb hier. Das ist keine Ablage für Übriggebliebenes:
       §46 sagt, dass nichts verschwinden darf, und ein Weg, den man nur
       noch über die Adresszeile findet, ist verschwunden. */
    { name: 'Wo du arbeitest', eintraege: [
      { z: '▤', t: 'Workspace', s: 'Übersicht, Datenbanken, Wiki und Vorlagen.', a: 'workspace' },
      { z: '⌂', t: 'Arbeitsbereich', s: 'Name, Zeichen und der Baum aller Seiten.', a: 'schublade' } ] },
    { name: 'Wichtige Werkzeuge', eintraege: [
      { z: '🧭', t: 'Kompass', s: 'Wie Redion aufgebaut ist und was du machen kannst.', a: 'kompass' },
      { z: '⌘', t: 'Befehle', s: 'Slash-Befehle und Aktionen.', a: 'befehle' },
      { z: '⌨', t: 'Tastenkürzel', s: 'Alle wichtigen Kürzel.', a: 'tasten' },
      { z: '🧩', t: 'Vorlagen', s: 'Startpakete und fertige Seiten.', a: 'vorlagen' } ] },
    { name: 'Daten und Sicherheit', eintraege: [
      { z: '💾', t: 'Sicherung', s: 'JSON und .redion — mit Anhängen oder ohne.', a: 'sichern' },
      { z: '📥', t: 'Importieren', s: 'Dateien und Sicherungen laden.', a: 'import' },
      { z: '📥', t: 'Posteingang', s: 'Erinnerungen, Kommentare, Erwähnungen.', a: 'inbox' },
      /* DER WEG ZUR WOLKE (E251). Der Dialog konnte längst anmelden und
         abgleichen — erreichbar war er nur über die Befehlspalette, und
         ein Weg, den man nur über die Palette findet, ist verschwunden
         (dieselbe Regel wie zwei Gruppen weiter oben). Hier steht er
         neben Sicherung und Import, wo Daten-Dinge wohnen. */
      { z: '☁', t: 'Wolke', s: 'Konto, Anmelden und Abgleich zwischen Geräten.', a: 'wolke' },
      { z: '🗑', t: 'Papierkorb', s: 'Gelöschte Seiten wiederherstellen.', a: 'papierkorb' } ] },
    { name: 'System', eintraege: [
      { z: '⚙', t: 'Einstellungen', s: 'Darstellung, Speicher, KI, Konto und Wolke.', a: 'einstellungen' },
      { z: 'ℹ', t: 'Über Redion', s: 'Fassung, Hilfe und Angaben zum Projekt.', a: 'ueber' } ] }
  ];

  const mehr = (): void => bildschirm('Mehr', (wrap: HTMLElement) => {

    wrap.className = '';
    wrap.innerHTML =
      '<div class="home">' +
        '<h1>Mehr</h1>' +
        mehrGruppen().map(g =>
          `<h2>${esc(g.name)}</h2><div class="home-liste">` +
          g.eintraege.map(e =>
            `<button data-a="${esc(e.a)}"><span class="mz">${esc(e.z)}</span>` +
            `<span class="pt">${esc(e.t)}` +
            `<span class="snip">${esc(e.s)}</span></span>` +
            '<span class="pth">›</span></button>').join('') +
          '</div>').join('') +
      '</div>';

    wrap.onclick = (e: Event) => {
      const el = (e.target instanceof Element) ? e.target : null;
      const a = el?.closest<HTMLElement>('[data-a]')?.dataset.a;
      if (!a) return;
      /* Die zwei Wege, die mit E236 aus der Navigation hierherkamen. */
      if (a === 'workspace')          Produktwelten.workspace('start');
      else if (a === 'schublade')     App.arbeitsbereich();
      else if (a === 'kompass')       kompass();
      else if (a === 'befehle')       Werkzeuge.palette();
      else if (a === 'tasten')        Werkzeuge.tastenkuerzel();
      else if (a === 'vorlagen')      Werkzeuge.vorlagen && Werkzeuge.vorlagen();
      else if (a === 'sichern')       App.sicherungSpeichern();
      else if (a === 'import')        Werkzeuge.dateienLesen();
      else if (a === 'inbox')         posteingang();
      else if (a === 'wolke') {
        if (typeof WolkeFenster !== 'undefined') WolkeFenster.dialog();
        else UI.toast('Die Wolke ist in dieser Fassung nicht geladen.');
      }
      else if (a === 'papierkorb')    App.papierkorb();
      else if (a === 'einstellungen') App.einstellungen();
      else if (a === 'ueber')         App.einstellungen('ueber');
    };
  });

  /* ========================================================================
   * KOMPASS — was diese App kann, an einer Stelle
   * ------------------------------------------------------------------------
   * Der Bereich, den Redurs Entwurf als einzigen ganz neu erfindet, und der
   * die grösste Lücke schliesst: Redion kann viel, und nichts davon sagt es
   * von selbst. Wer nicht weiss, dass es Karteikarten gibt, findet sie nie.
   *
   * ZWEI SACHEN SIND HIER ABSICHTLICH SO GEBAUT:
   *
   * Die Befehle tragen ihren Stand — fertig, teilweise, geplant. Ein
   * Wegweiser, der Geplantes wie Fertiges aussehen lässt, ist eine
   * Enttäuschung mit Ansage. Lieber steht daneben „geplant".
   *
   * Und die Liste kommt, wo es geht, aus dem Register statt aus dieser
   * Datei. Eine von Hand gepflegte Aufzählung erzählt nach dem dritten
   * neuen Befehl von einer App, die es nicht mehr gibt.
   * ======================================================================*/
  const kompass = (): void => bildschirm('Kompass', (wrap: HTMLElement) => {

    const aufbau = [
      ['Start', 'Armaturenbrett mit Schnellkarten, Sicherungsstand und zuletzt Bearbeitetem.'],
      ['Seiten', 'Alles Geschriebene: kürzlich, Favoriten, privat, Datenbanken, Vorlagen.'],
      ['Termine', 'Was ansteht — Aufgaben mit Datum, Erinnerungen, Besprechungen.'],
      ['Mehr', 'Werkzeuge, Sicherung, Import, Papierkorb, Einstellungen.'],
      ['R-Blatt', 'Der Arbeitsbereich: Suche, Befehle, jeder Weg auf einen Griff.']
    ];
    const befehle = [
      ['/', 'Blockmenü öffnen', 'fertig'],
      ['@', 'Seite, Datum oder Person erwähnen', 'fertig'],
      ['#', 'Schlagwort erstellen', 'teilweise'],
      [':', 'Emoji einfügen', 'fertig'],
      ['[[', 'Seite verlinken', 'geplant']
    ];
    const tasten = [
      ['Strg + P', 'Suchen'], ['Strg + ⇧ + P', 'Befehle'], ['Strg + N', 'Neue Seite'],
      ['Strg + /', 'Tastenkürzel'], ['Esc', 'Menü schliessen']
    ];
    /* Aus dem Register, nicht von Hand: so altert die Liste mit der App. */
    const kann = (() => {
      try {
        const b = Object.keys(Register.bloecke?.alle?.() || Register.bloecke || {}).length;
        const a = (Register.ansichten?.alle?.() || []).length;
        return [
          'Notizen schreiben', 'Seiten verlinken', 'Datenbanken bauen',
          b ? b + ' Blockarten' : '', a ? a + ' Ansichten' : '',
          'Formeln rechnen', 'Dateien behalten', 'Sicherungen schreiben',
          'Importieren', 'Karteikarten lernen', 'KI fragen'
        ].filter(Boolean);
      } catch {
        return ['Notizen schreiben', 'Datenbanken bauen', 'Formeln rechnen',
                'Sicherungen schreiben', 'Karteikarten lernen', 'KI fragen'];
      }
    })();
    const marke = (stand: string) =>
      `<span class="kp-marke kp-${stand}">${esc(stand)}</span>`;

    wrap.className = '';
    wrap.innerHTML =
      '<div class="home">' +
        '<h1>Kompass</h1>' +
        '<p class="kp-vor">Was du in Redion machen kannst — und wo es steht.</p>' +
        '<h2>App-Aufbau</h2><div class="kp-liste">' +
          aufbau.map(([n, t]) =>
            `<div class="kp-zeile"><b>${esc(n)}</b><span>${esc(t)}</span></div>`).join('') +
        '</div>' +
        '<h2>Befehle</h2><div class="kp-liste">' +
          befehle.map(([k, t, stand]) =>
            `<div class="kp-befehl"><code>${esc(k)}</code><span>${esc(t)}</span>` +
            marke(String(stand)) + '</div>').join('') +
        '</div>' +
        '<h2>Tastenkürzel</h2><div class="kp-liste">' +
          tasten.map(([k, t]) =>
            `<div class="kp-taste"><kbd>${esc(k)}</kbd><span>${esc(t)}</span></div>`).join('') +
          '<div class="kp-fuss">Auf dem Mac: Cmd statt Strg.</div>' +
        '</div>' +
        '<h2>Redion kann</h2><div class="kp-wolke">' +
          kann.map(n => `<span>${esc(n)}</span>`).join('') +
        '</div>' +
        '<div class="kp-karte">' +
          '<b>Sicherung</b>' +
          '<div>JSON — schnell, ohne Anhänge.<br>' +
          '.redion — vollständig, mit Anhängen.<br>' +
          'Wolke — freiwillig, nie Pflicht.</div>' +
          '<button data-a="sichern">Sicherung öffnen</button>' +
        '</div>' +
      '</div>';

    wrap.onclick = (e: Event) => {
      const el = (e.target instanceof Element) ? e.target : null;
      if (el?.closest<HTMLElement>('[data-a="sichern"]')) App.sicherungSpeichern();
    };
  });

  /* ========================================================================
   * DAS SKELETT — was dasteht, bevor etwas dasteht (Vorgabe §23, E46)
   * ------------------------------------------------------------------------
   * Ein Kreisel sagt „warte". Ein Skelett sagt „hier kommen sechs Zeilen
   * mit einem Symbol links und einem Datum rechts" — man weiss, was gleich
   * kommt, und wenn es kommt, springt nichts.
   *
   * Die Strichbreiten sind ABSICHTLICH ungleich. Sechs gleich lange
   * Balken sehen aus wie ein Muster; ungleiche sehen aus wie Text, und
   * genau darum geht es.
   * ======================================================================*/
  const skelett = (wieViele = 6, mitKarten = false): string =>
    (mitKarten
      ? '<div class="sk-karten"><div class="sk-karte"></div><div class="sk-karte"></div></div>'
      : '') +
    '<div class="sk-titel">Wird geladen …</div><div class="sk-liste">' +
    ['62%', '48%', '71%', '54%', '40%', '66%', '58%', '45%']
      .slice(0, wieViele)
      .map(b => '<div class="sk-zeile"><div class="sk-punkt"></div>' +
                `<div class="sk-strich" style="width:${b}"></div>` +
                '<div class="sk-rechts"></div></div>').join('') +
    '</div>';

  /**
   * Ein Skelett auf die Bühne stellen, bis der Inhalt da ist.
   *
   * WARUM MIT FRIST. Ein Skelett, das bei jedem Wechsel aufblitzt, ist
   * schlimmer als keines — die Ansicht flackert. Erst ab 180 ms Wartezeit
   * lohnt es sich; darunter merkt niemand, dass etwas geladen wurde.
   */
  const beimLaden = async <T>(arbeit: () => Promise<T>, wieViele = 6,
                              mitKarten = false): Promise<T> => {
    const f = flaeche();
    let gezeigt = false;
    const uhr = setTimeout(() => {
      if (f) { f.wrap.innerHTML = '<div class="home">' + skelett(wieViele, mitKarten) + '</div>'; }
      gezeigt = true;
    }, 180);
    try { return await arbeit(); }
    finally { clearTimeout(uhr); void gezeigt; }
  };

  return { start, seiten, termine, mehr, kompass, posteingang, posteingangFilter,
           gruss, skelett, beimLaden };
})();
(window as any).Ansichten = Ansichten;

/* Die Startansicht „Heute" meldet ihre Kontextkante an (E272 Phase F). */
if (typeof Register !== 'undefined' && (Register as any).kontext) {
  const K = (Register as any).kontext;
  const bereiche = ['heute', 'leer'];
  for (const b of bereiche) {
    K.melde({ bereich: b, id: 'ueberblick', name: 'Überblick',
      zeichen: 'today', rang: 10, tun: () => Ansichten.start() });
    K.melde({ bereich: b, id: 'seiten', name: 'Seiten und Notizen',
      zeichen: 'pages', rang: 20, tun: () => Ansichten.seiten() });
    K.melde({ bereich: b, id: 'termine', name: 'Termine',
      zeichen: 'calendar', rang: 30, tun: () => Ansichten.termine() });
    K.melde({ bereich: b, id: 'posteingang', name: 'Posteingang',
      zeichen: 'inbox', rang: 40, tun: () => Ansichten.posteingang() });
    /* ZULETZT GEÖFFNET, ganz oben im Bild und ganz oben in der Kante —
       derselbe Bestand wie im Startbild (`App.kuerzlich()`). */
    K.melde({ bereich: b, id: 'zuletzt', name: 'Zuletzt geöffnet',
      zeichen: 'history', rang: 50,
      liefern: () => {
        let letzte: any[] = [];
        try { letzte = App.kuerzlich() || []; } catch { letzte = []; }
        if (!letzte.length) return [{ id: 'keine', name: 'Noch nichts geöffnet.',
                                      tun: () => {} }];
        return letzte.map((x: any) => ({
          id: 'z-' + x.id, name: String(x.text || 'Ohne Titel'), zeichen: 'page',
          tun: () => { try { App.oeffne(x.id); } catch { /* … */ } }
        }));
      }
    });
  }
}

/* ============================================================================
 * DIE KANTEN DER VIER ÜBRIGEN BILDSCHIRME DIESER DATEI (E273)
 * ----------------------------------------------------------------------------
 * „Heute" und „leer" stehen oben. Posteingang, Kalender, Kompass und Mehr
 * standen bis E273 NICHT hier, und der Grund war kein Versäumnis: es gab die
 * Schauplätze nicht. Die vier Bildschirme zeichneten sich selbst in `#page`,
 * ohne `zeigeSonder`, und `App.schauplatz()` blieb auf dem letzten stehen.
 * Ein Knopf mit `bereich: 'posteingang'` wäre nie gezeichnet worden.
 *
 * Seit `bildschirm()` weiter oben gibt es die Schauplätze wirklich. Erst
 * deshalb steht das hier.
 * ==========================================================================*/
if (typeof Register !== 'undefined' && (Register as any).kontext) {
  const K = (Register as any).kontext;
  const da = (pfad: () => unknown): boolean => {
    try { return typeof pfad() === 'function'; } catch { return false; }
  };

  /* --- POSTEINGANG ------------------------------------------------------- */
  K.melde({ bereich: 'posteingang', id: 'uebersicht', name: 'Übersicht',
    zeichen: 'inbox', rang: 10, tun: () => Ansichten.posteingang() });

  /* Die drei Listen sind Laden und keine Knöpfe: sie ändern sich, während
     man hinsieht, und dürfen deshalb erst beim Öffnen entstehen. */
  K.melde({ bereich: 'posteingang', id: 'meldungen', name: 'Benachrichtigungen',
    zeichen: 'bell', rang: 20,
    zeigen: () => da(() => Werkzeuge.meldungen),
    liefern: () => {
      let liste: any[] = [];
      try { liste = Werkzeuge.meldungen() || []; } catch { liste = []; }
      if (!liste.length) return [{ id: 'keine', name: 'Nichts Neues.', tun: () => {} }];
      /* Dreissig, wie im Posteingang selbst. Eine Lade, die vierhundert
         Zeilen zeichnet, macht den Klick langsam und niemanden klüger. */
      return liste.slice(0, 30).map((m: any, i: number) => ({
        id: 'm-' + (m.id ?? i), name: String(m.text || 'Meldung'),
        ...(m.gelesen ? {} : { unter: 'ungelesen' }),
        zeichen: m.gelesen ? 'checkCircle' : 'bell',
        tun: () => {
          try { if (m.id) Werkzeuge.meldungGelesen(m.id); } catch { /* … */ }
          try { if (m.seite) App.oeffne(m.seite); else Ansichten.posteingang(); }
          catch { /* … */ }
        }
      }));
    }
  });

  K.melde({ bereich: 'posteingang', id: 'erinnerungen', name: 'Erinnerungen',
    zeichen: 'clock', rang: 30,
    zeigen: () => da(() => Werkzeuge.erinnerungen),
    liefern: () => {
      let liste: any[] = [];
      try { liste = Werkzeuge.erinnerungen() || []; } catch { liste = []; }
      if (!liste.length) return [{ id: 'keine', name: 'Keine Erinnerungen.', tun: () => {} }];
      /* DIE ZEIT IST DAS EINZIGE, WOFÜR EINE ERINNERUNG DA IST.
         Sie steht deshalb im zweiten Satz, und die nächste steht oben. */
      return [...liste]
        .sort((a: any, b: any) => String(b.zeit || '').localeCompare(String(a.zeit || '')))
        .slice(0, 30)
        .map((e: any, i: number) => {
          let wann = '';
          try { wann = Werkzeuge.zeitKurz(e.zeit) || ''; } catch { wann = ''; }
          return {
            id: 'e-' + (e.id ?? i), name: String(e.text || 'Erinnerung'),
            ...(wann ? { unter: wann } : {}),
            zeichen: e.erledigt ? 'checkCircle' : 'clock',
            tun: () => { try { if (e.pageId) App.oeffne(e.pageId); } catch { /* … */ } }
          };
        });
    }
  });

  K.melde({ bereich: 'posteingang', id: 'anmich', name: 'An dich gerichtet',
    zeichen: 'comment', rang: 40,
    zeigen: () => da(() => (globalThis as any).Kommentare?.anMich),
    liefern: () => {
      let liste: any[] = [];
      try { liste = (globalThis as any).Kommentare.anMich() || []; } catch { liste = []; }
      if (!liste.length) return [{ id: 'keine', name: 'Nichts an dich.', tun: () => {} }];
      /* `id` und `name` SIND PFLICHT — `zeilen()` (register/context.ts:177)
         wirft jede Zeile ohne sie lautlos weg. `anMich` liefert
         `{ block, k }`, also weder das eine noch das andere; wer die Liste
         durchreicht, bekommt eine leere Lade und keinen Fehler. */
      return liste.slice(0, 30).map((m: any, i: number) => ({
        id: 'am-' + (m?.k?.id ?? i),
        name: String(m?.k?.text || 'Kommentar'),
        unter: String(m?.k?.autor || 'jemand'),
        zeichen: 'comment',
        /* `zeigeBlock` statt `oeffne(parentId)` — siehe die Begründung an
           der Zeile im Posteingang (E275, L98). */
        tun: () => { try { App.zeigeBlock(String(m?.block?.id || '')); }
                     catch { /* … */ } }
      }));
    }
  });

  /* ALLE GELESEN — und ausdrücklich NICHT „leeren" (E276, L96).
     `meldungenLeeren` räumt denselben Punkt weg und wirft dabei alles fort.
     An einem Kantenknopf, der ohne Rückfrage auslöst, hat das nichts zu
     suchen; hier steht der Griff, der ein Feld ändert statt etwas zu
     nehmen. Sichtbar nur, solange es überhaupt etwas Ungelesenes gibt —
     sonst wäre es ein Knopf, der nichts tut (§47). */
  K.melde({ bereich: 'posteingang', id: 'gelesen', name: 'Alle gelesen',
    zeichen: 'checkCircle', rang: 50,
    zeigen: () => {
      if (!da(() => Werkzeuge.meldungenAlleGelesen)) return false;
      try { return (Werkzeuge.meldungen() || []).some((m: any) => !m.gelesen); }
      catch { return false; }
    },
    tun: () => {
      let wie = 0;
      try { wie = Werkzeuge.meldungenAlleGelesen() || 0; } catch { /* … */ }
      try { UI.toast(wie === 1 ? '1 Meldung als gelesen markiert'
                               : wie + ' Meldungen als gelesen markiert'); }
      catch { /* … */ }
      try { Ansichten.posteingang(); } catch { /* … */ }
    } });

  /* --- KALENDER („Termine") ---------------------------------------------- */
  K.melde({ bereich: 'kalender', id: 'uebersicht', name: 'Übersicht',
    zeichen: 'calendar', rang: 10, tun: () => Ansichten.termine() });
  K.melde({ bereich: 'kalender', id: 'kommend', name: 'Kommende Termine',
    zeichen: 'clock', rang: 20,
    liefern: () => {
      let liste: any[] = [];
      try { liste = App.kommendeTermine(12) || []; } catch { liste = []; }
      if (!liste.length) return [{ id: 'keine', name: 'Nichts steht an.', tun: () => {} }];
      return liste.map((t: any, i: number) => ({
        id: 't-' + (t.id ?? i), name: String(t.text || 'Termin'),
        ...(t.wann ? { unter: String(t.wann) } : {}),
        zeichen: 'calendar',
        tun: () => { try { if (t.id) App.oeffne(t.id); } catch { /* … */ } }
      }));
    }
  });
  K.melde({ bereich: 'kalender', id: 'tagesplan', name: 'Tagesplan',
    zeichen: 'today', rang: 30,
    zeigen: () => da(() => (globalThis as any).Plan?.tagesplan),
    tun: () => (globalThis as any).Plan.tagesplan() });
  K.melde({ bereich: 'kalender', id: 'woche', name: 'Wochenrückblick',
    zeichen: 'chart', rang: 40,
    zeigen: () => da(() => (globalThis as any).Plan?.wochenrueckblick),
    tun: () => (globalThis as any).Plan.wochenrueckblick() });
  K.melde({ bereich: 'kalender', id: 'verbinden', name: 'Kalender verbinden',
    zeichen: 'link', rang: 50,
    zeigen: () => da(() => (globalThis as any).Kalender?.dialog),
    tun: () => (globalThis as any).Kalender.dialog() });
  /* ABGLEICHEN NUR MIT ABO. `alleAbosHolen` steigt ohne eines sofort wieder
     aus — der Knopf täte dann sichtbar nichts (§47). */
  K.melde({ bereich: 'kalender', id: 'abgleichen', name: 'Jetzt abgleichen',
    zeichen: 'redo', rang: 60,
    zeigen: () => {
      if (!da(() => (globalThis as any).Kalender?.alleAbosHolen)) return false;
      try { return ((globalThis as any).Kalender.abos() || []).length > 0; }
      catch { return false; }
    },
    tun: () => { void (globalThis as any).Kalender.alleAbosHolen(); } });

  /* --- KOMPASS und MEHR --------------------------------------------------
     Zwei Übersichtsseiten. Sie brauchen keine eigenen Werkzeuge — sie SIND
     das Werkzeug —, aber ohne einen einzigen Knopf stünde die Kante leer da
     und sähe aus wie ein Fehler. Die drei Wege sind die, die von einer
     Übersicht aus wirklich weiterführen. */
  for (const b of ['kompass', 'mehr']) {
    K.melde({ bereich: b, id: 'start', name: 'Start',
      zeichen: 'today', rang: 10, tun: () => Ansichten.start() });
    K.melde({ bereich: b, id: 'kompass', name: 'Kompass',
      zeichen: 'compass', rang: 20, tun: () => Ansichten.kompass() });
    K.melde({ bereich: b, id: 'mehr', name: 'Mehr',
      zeichen: 'menu', rang: 30, tun: () => Ansichten.mehr() });
  }
}
