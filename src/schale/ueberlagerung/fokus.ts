/* ============================================================================
 * schale/ueberlagerung/fokus.js — Dialoge für die Tastatur und fürs Zuhören
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/schale/ueberlagerung/fokus.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/schale/ueberlagerung/fokus.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es vorher.
 * ----------------------------------------------------------------------------
 * WARUM ES DIESE DATEI GIBT.
 *
 * Redion baut seine Überlagerungen an 106 Stellen — jedes Mal ein `<div
 * class="overlay">` mit `document.body.appendChild`. Gemessen am 7. August
 * fehlte allen dasselbe, und keine dieser 106 Stellen war schuld:
 *
 *   · KEINE ROLLE. Für ein Vorleseprogramm ist ein `<div>` über der Seite
 *     kein Dialog, sondern Text am Ende des Dokuments. Es sagt nicht, dass
 *     etwas aufgegangen ist, und nicht, was.
 *
 *   · DER FOKUS BLIEB DRAUSSEN. Die Einstellungen gingen auf, und die
 *     Tastatur stand weiter auf dem Knopf dahinter. Wer nur die Tastatur
 *     hat, musste sich durch die ganze Seite tabben, um in den Dialog zu
 *     kommen, der schon vor ihm stand.
 *
 *   · TAB LIEF HINAUS. Nach zehn Tabs stand der Fokus in der Seitenleiste
 *     HINTER dem Dialog — sichtbar war er dort nirgends, denn darüber lag
 *     die Überlagerung. Man tippte ins Nichts.
 *
 *   · UND ER KAM NICHT ZURÜCK. Nach dem Schliessen stand der Fokus auf
 *     `<body>`. Das nächste Tab fing wieder ganz oben an — bei jedem
 *     Schliessen eines Menüs.
 *
 * EINE STELLE STATT 106. Ein Beobachter sieht zu, was an `<body>` gehängt
 * wird, und legt das Fehlende auf. Das ist nicht nur weniger Arbeit: die
 * 107. Überlagerung bekommt es dann auch, ohne dass jemand daran denkt.
 *
 * WAS ER NICHT TUT: er nimmt niemandem den Fokus weg, der schon gesetzt
 * wurde. Die Suche setzt ihn auf ihr Feld, der Papierkorb auf seins — wer
 * das überschreibt, macht drei richtige Dialoge kaputt, um einen falschen
 * zu heilen.
 * ==========================================================================*/

const Fokus = (() => {

  /** Was die Tastatur erreichen kann. */
  const GREIFBAR =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
    'textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

  /** Die Überlagerungen, um die es geht. */
  const DIALOGE = '.overlay, .menu-grund';

  /** Woher man kam — je offener Überlagerung eine Erinnerung. */
  const herkunft = new WeakMap<Element, Element>();

  /**
   * Das zuletzt berührte Element AUSSERHALB jeder Überlagerung.
   *
   * Nötig wegen der Reihenfolge: ein Beobachter meldet sich erst nach dem
   * laufenden Durchgang, und die meisten Dialoge setzen ihren Fokus noch
   * darin — direkt nach dem `appendChild`. Wer beim Anmelden nach dem
   * aktiven Element fragt, bekommt deshalb meistens ein Feld IM Dialog,
   * merkt sich das als Herkunft, und beim Schliessen ist es längst weg.
   *
   * Genau das war der Fehler: von vier Dialogen kehrte nur einer zurück —
   * ausgerechnet der, der seinen Fokus gar nicht setzte.
   */
  let letzterAussen: Element | null = null;

  const sichtbar = (el: Element): boolean => {
    const r = (el as HTMLElement).getBoundingClientRect();
    return !!(r.width || r.height);
  };

  const greifbareIn = (d: Element): HTMLElement[] =>
    [...d.querySelectorAll<HTMLElement>(GREIFBAR)].filter(sichtbar);

  /** Die oberste offene Überlagerung — die letzte im Dokument. */
  const oberste = (): HTMLElement | null => {
    const alle = [...document.querySelectorAll<HTMLElement>(DIALOGE)];
    return alle.length ? alle[alle.length - 1]! : null;
  };

  /**
   * Einer neu erschienenen Überlagerung geben, was ihr fehlt.
   *
   * `aria-modal` ist die halbe Miete: damit behandelt ein Vorleseprogramm
   * alles ausserhalb als nicht vorhanden, solange der Dialog steht. Ohne
   * das liest es weiter durch die Seite dahinter, die niemand mehr
   * bedienen kann.
   */
  const anmelden = (d: HTMLElement): void => {
    if (d.dataset.fokusFertig) return;
    d.dataset.fokusFertig = 'ja';

    if (!d.getAttribute('role')) d.setAttribute('role', 'dialog');
    if (!d.hasAttribute('aria-modal')) d.setAttribute('aria-modal', 'true');

    /* Ein Name, wenn einer dasteht. `.fh` ist Redions Dialogkopf; sonst die
       erste Überschrift. Ein Dialog ohne Namen heisst beim Vorlesen nur
       „Dialog" — richtig, aber nutzlos. */
    if (!d.getAttribute('aria-label') && !d.getAttribute('aria-labelledby')) {
      const kopf = d.querySelector<HTMLElement>('.fh, .mt-titel, h2, h3');
      /* Kein Kopf? Dann der Platzhalter des ersten Feldes. „Seiten und
         Inhalte suchen" ist ein besserer Dialogname als „Dialog". */
      const name = (kopf?.textContent || '').trim() ||
                   (d.querySelector<HTMLInputElement>('input[placeholder]')?.placeholder || '').trim();
      if (name) d.setAttribute('aria-label', name.slice(0, 80));
    }

    /* Woher wir kamen — für die Rückkehr beim Schliessen. Das aktive
       Element nur dann, wenn es NICHT schon im Dialog steht; sonst die
       letzte Stelle draussen. */
    const jetzt = document.activeElement;
    const vorher = (jetzt && !d.contains(jetzt)) ? jetzt : letzterAussen;
    if (vorher && vorher !== document.body && document.contains(vorher))
      herkunft.set(d, vorher);

    /* DEN FOKUS NUR HOLEN, WENN IHN NIEMAND GESETZT HAT. Ein Takt warten:
       die meisten Dialoge setzen ihn im selben Durchlauf, direkt nach dem
       `appendChild`. Wer hier sofort zugreift, kommt ihnen zuvor. */
    setTimeout(() => {
      if (!d.isConnected) return;
      if (d.contains(document.activeElement)) return;
      const erstes = greifbareIn(d)[0];
      if (erstes) { erstes.focus(); return; }
      /* Nichts zu greifen — dann wenigstens der Kasten selbst, damit ein
         Vorleseprogramm überhaupt hineinspringt. */
      d.tabIndex = -1;
      d.focus();
    }, 0);
  };

  /**
   * Tab hält im obersten Dialog.
   *
   * Der Browser kennt nur eine Reihenfolge, und die geht durch das ganze
   * Dokument. Solange eine Überlagerung davorliegt, ist alles dahinter
   * nicht bedienbar — der Fokus muss also am Ende wieder an den Anfang.
   */
  const tasten = (e: KeyboardEvent): void => {
    if (e.key !== 'Tab') return;
    const d = oberste();
    if (!d || !d.isConnected) return;

    const liste = greifbareIn(d);
    if (!liste.length) { e.preventDefault(); return; }

    const erstes = liste[0]!;
    const letztes = liste[liste.length - 1]!;
    const a = document.activeElement;

    /* Steht der Fokus gar nicht im Dialog — etwa weil er hinter ihm hängen
       geblieben ist —, holt ihn der nächste Tab hinein. */
    if (!d.contains(a)) { e.preventDefault(); (e.shiftKey ? letztes : erstes).focus(); return; }
    if (!e.shiftKey && a === letztes) { e.preventDefault(); erstes.focus(); }
    else if (e.shiftKey && a === erstes) { e.preventDefault(); letztes.focus(); }
  };

  /**
   * Beim Schliessen dorthin zurück, wo man war.
   *
   * Ohne das steht der Fokus auf `<body>`, und das nächste Tab fängt oben
   * an. Bei einem Menü, das man zehnmal am Tag öffnet, ist das zehnmal die
   * ganze Seitenleiste.
   */
  const gegangen = (weg: Node[]): void => {
    for (const n of weg) {
      if (!(n instanceof HTMLElement)) continue;
      const ziel = herkunft.get(n);
      herkunft.delete(n);
      if (!ziel || !document.contains(ziel)) continue;
      /* Nur, wenn der Fokus wirklich verwaist ist. Hat inzwischen etwas
         anderes ihn übernommen — ein zweiter Dialog, ein Textfeld —, wäre
         das Zurückholen ein Diebstahl. */
      const a = document.activeElement;
      if (a && a !== document.body && a !== document.documentElement) continue;
      if (document.querySelector(DIALOGE)) continue;   /* noch etwas offen */
      (ziel as HTMLElement).focus?.();
    }
  };

  let laeuft = false;

  const start = (): void => {
    if (laeuft) return;
    laeuft = true;

    document.querySelectorAll<HTMLElement>(DIALOGE).forEach(anmelden);

    new MutationObserver(aend => {
      for (const a of aend) {
        a.addedNodes.forEach(n => {
          if (!(n instanceof HTMLElement)) return;
          if (n.matches(DIALOGE)) anmelden(n);
          else n.querySelectorAll<HTMLElement>(DIALOGE).forEach(anmelden);
        });
        if (a.removedNodes.length) gegangen([...a.removedNodes]);
      }
    }).observe(document.body, { childList: true, subtree: true });

    /* In der Aufnahmephase, damit die Falle vor den Feldern im Dialog
       greift — sonst schiebt der Browser den Fokus schon hinaus, bevor
       wir ihn halten können. */
    document.addEventListener('keydown', tasten, true);

    /* Mitschreiben, wo der Fokus draussen zuletzt stand. */
    document.addEventListener('focusin', e => {
      const z = e.target;
      if (!(z instanceof HTMLElement)) return;
      if (z.closest(DIALOGE)) return;
      letzterAussen = z;
    }, true);
  };

  return { start, anmelden, greifbareIn, oberste };
})();

if (typeof window !== 'undefined') {
  if (document.body) Fokus.start();
  else document.addEventListener('DOMContentLoaded', () => Fokus.start());
}
