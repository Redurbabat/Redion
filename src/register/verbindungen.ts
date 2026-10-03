/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/verbindungen.ts (npm run bauen:ts). */
/* ============================================================================
 * register/verbindungen.js — was nach draussen geht
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/register/verbindungen.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/register/verbindungen.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Jede Verbindung ist eine Tür. Deshalb steht hier zu jeder nicht nur, wie
 * sie heisst, sondern **was hinausgeht und was hereinkommt** — und zwar in
 * einem Satz, den man vor dem Verbinden liest, nicht danach.
 *
 * Das ist der eigentliche Zweck dieser Datei. Eine Liste von Diensten baut
 * man in zehn Minuten. Eine Liste, die ehrlich sagt, welche Daten wohin
 * gehen, muss jemand pflegen — und sie muss an einer Stelle stehen, sonst
 * pflegt sie niemand.
 *
 * Ein Eintrag:
 *
 *     id        eindeutig
 *     name      der Dienst
 *     art       'kalender' | 'mail' | 'ablage' | 'ki' | 'nachricht' | 'code'
 *     hinaus    was diesen Rechner verlässt
 *     herein    was hereinkommt
 *     schluessel wo der Schlüssel herkommt — nie im Code, immer vom Menschen
 *     bereit()  ist sie eingerichtet?
 * ==========================================================================*/

(window as any).Register = (window as any).Register || {};

Register.verbindungen = (() => {

  /**
   * Eine Verbindung nach draussen.
   *
   * `hinaus` und `herein` sind Pflicht, und das ist Absicht: eine
   * Verbindung, bei der niemand aufgeschrieben hat, was das Gerät verlässt,
   * gehört nicht in diese Liste.
   */
  type Verbindung = {
    id: string; name: string; art: string;
    hinaus: string; herein: string; schluessel: string;
    bereit: () => boolean;
  };

  const meta = (k: string): string => {
    try { return (typeof Store !== 'undefined') ? Store.getMeta(k, '') : ''; }
    catch { return ''; }
  };

  const EINGEBAUT = [
    { id: 'google-kalender', name: 'Google Kalender', art: 'kalender',
      hinaus: 'Nichts. Termine werden nur gelesen.',
      herein: 'Termine der nächsten Wochen, für die Kalenderansicht.',
      schluessel: 'OAuth im Browser — der Schlüssel liegt hier, nicht im Code.',
      bereit: () => !!meta('googleToken') },

    { id: 'icloud-kalender', name: 'iCloud Kalender', art: 'kalender',
      hinaus: 'Nichts.',
      herein: 'Termine über eine ICS-Adresse, nur lesend.',
      schluessel: 'Eine ICS-Adresse, die man selbst einträgt.',
      bereit: () => !!meta('icsAdresse') },

    { id: 'mail', name: 'Mail (IMAP über die Brücke)', art: 'mail',
      hinaus: 'Nichts ausser der Anfrage selbst.',
      herein: 'Betreff und Absender, um daraus Aufgaben zu machen.',
      schluessel: 'Zugangsdaten trägt man selbst ein und sie bleiben auf dem Gerät.',
      bereit: () => !!meta('mailKonto') },

    { id: 'ki-anbieter', name: 'KI-Anbieter', art: 'ki',
      hinaus: 'Der Text, den du markierst oder die Seite, die du öffnest — ' +
              'genau so viel, wie in den Einstellungen steht.',
      herein: 'Die Antwort. Sie wird nirgends zwischengespeichert.',
      schluessel: 'Dein eigener Schlüssel, im Einstellungsfeld. Er wird nie ' +
                  'irgendwohin sonst geschickt.',
      bereit: () => !!meta('kiSchluessel') },

    { id: 'wolke', name: 'Redion-Server', art: 'ablage',
      hinaus: 'Private Seiten verschlüsselt, geteilte im Klartext. Was davon ' +
              'was ist, steht beim Teilen über dem Schalter.',
      herein: 'Was andere Geräte geändert haben.',
      schluessel: 'Anmeldung über GitHub, Google oder einen Gerätecode.',
      bereit: () => { try { return typeof Wolke !== 'undefined' && Wolke.angemeldet(); }
                      catch { return false; } } },

    { id: 'webhook-aus', name: 'Webhook hinaus', art: 'nachricht',
      hinaus: 'Genau das, was in der Automation steht — nicht mehr.',
      herein: 'Nichts.',
      schluessel: 'Eine Adresse, die man selbst einträgt.',
      bereit: () => !!meta('webhookAus') },

    { id: 'webhook-ein', name: 'Webhook herein', art: 'nachricht',
      hinaus: 'Nichts.',
      herein: 'Was ein fremder Dienst schickt — landet als Zeile oder Seite.',
      schluessel: 'Eine Adresse, die Redion vergibt; wer sie kennt, darf schreiben.',
      bereit: () => !!meta('eingangAn') },

    { id: 'mcp', name: 'MCP-Werkzeuge', art: 'code',
      hinaus: 'Was das Werkzeug ausdrücklich anfordert.',
      herein: 'Das Ergebnis des Werkzeugs.',
      schluessel: 'Die Adresse des Servers, selbst eingetragen.',
      bereit: () => !!meta('mcpServer') }
  ];

  const LISTE: Verbindung[] = EINGEBAUT.slice();

  const melde = (eintrag: unknown): boolean => {
    const e = eintrag as Verbindung | null;
    if (!e || !e.id) return false;
    if (LISTE.some(x => x.id === e.id)) return false;
    LISTE.push(e);
    return true;
  };

  const alle = (): Verbindung[] => LISTE;
  const eines = (id: unknown): Verbindung | null => LISTE.find(x => x.id === id) || null;
  const arten = (): string[] => [...new Set(LISTE.map(x => x.art))];
  const inArt = (a: unknown): Verbindung[] => LISTE.filter(x => x.art === a);

  /** Welche sind eingerichtet? Für die Übersicht in den Einstellungen. */
  const eingerichtet = () => LISTE.filter(x => {
    try { return !!x.bereit(); } catch { return false; }
  });

  /**
   * Was verlässt dieses Gerät überhaupt?
   * Ein Satz je eingerichteter Verbindung — die Antwort auf die einzige
   * Frage, die bei so einer Liste wirklich zählt.
   */
  const wasHinausgeht = () => eingerichtet().map(v => v.name + ': ' + v.hinaus);

  return { alle, eines, arten, inArt, eingerichtet, wasHinausgeht, melde,
           anzahl: () => LISTE.length };
})();
