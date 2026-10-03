"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/verbindungen.ts (npm run bauen:ts). */
window.Register = window.Register || {};
Register.verbindungen = (() => {
    const meta = (k) => {
        try {
            return (typeof Store !== 'undefined') ? Store.getMeta(k, '') : '';
        }
        catch {
            return '';
        }
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
            bereit: () => {
                try {
                    return typeof Wolke !== 'undefined' && Wolke.angemeldet();
                }
                catch {
                    return false;
                }
            } },
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
    const LISTE = EINGEBAUT.slice();
    const melde = (eintrag) => {
        const e = eintrag;
        if (!e || !e.id)
            return false;
        if (LISTE.some(x => x.id === e.id))
            return false;
        LISTE.push(e);
        return true;
    };
    const alle = () => LISTE;
    const eines = (id) => LISTE.find(x => x.id === id) || null;
    const arten = () => [...new Set(LISTE.map(x => x.art))];
    const inArt = (a) => LISTE.filter(x => x.art === a);
    const eingerichtet = () => LISTE.filter(x => {
        try {
            return !!x.bereit();
        }
        catch {
            return false;
        }
    });
    const wasHinausgeht = () => eingerichtet().map(v => v.name + ': ' + v.hinaus);
    return { alle, eines, arten, inArt, eingerichtet, wasHinausgeht, melde,
        anzahl: () => LISTE.length };
})();
