"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/ki/desktop.ts (npm run bauen:ts). */
const DesktopMCP = (() => {
    const names = { app: 'Navigation', documents: 'Notizen', databases: 'Datenbanken', learning: 'Lernkarten und Aufgaben', pdf: 'PDF öffnen', schematics: 'Schaltpläne', settings: 'Darstellung', visual: 'Bilder aus Redion übertragen' };
    const html = () => {
        if (!window.RedionDesktop?.automationState || window.RedionDesktop.automationSupported === false)
            return '<section class="desktop-automation"><h3>ChatGPT &amp; Automatisierung</h3><p>Die lokale Live-Steuerung benötigt die neue Redion-Windows-App. Auf diesem Gerät bleibt sie ausgeschaltet.</p></section>';
        return '<section class="desktop-automation" aria-labelledby="desktop-automation-title"><h3 id="desktop-automation-title">ChatGPT &amp; Automatisierung</h3>' +
            '<p>Nur nach deiner Freigabe. Angeforderte Inhalte können an ChatGPT gehen. Redion funktioniert auch ohne diese Verbindung.</p>' +
            '<p data-automation-status role="status">Verbindungsstatus wird gelesen …</p>' +
            '<label><input type="checkbox" data-automation-policy="enabled"> Verbindung aktivieren</label>' +
            '<label><input type="checkbox" data-automation-policy="write"> Schreibzugriffe erlauben</label>' +
            '<label><input type="checkbox" data-automation-policy="allowLaunch"> Start der installierten App erlauben</label>' +
            '<label data-automation-modern hidden><input type="checkbox" data-automation-policy="rememberClients"> Adapter nach der ersten Freigabe bis zum Widerruf erlauben</label>' +
            '<label data-automation-modern hidden><input type="checkbox" data-automation-policy="confirmCritical"> Kritische Aktionen zusätzlich einzeln bestätigen</label>' +
            '<label data-automation-visual hidden><input type="checkbox" data-automation-policy="confirmImages"> Bilder nach der Vorschau zusätzlich einzeln bestätigen</label>' +
            '<fieldset><legend>Freigegebene Funktionen</legend>' + Object.entries(names).map(([key, value]) => `<label${key === 'visual' ? ' data-automation-visual hidden' : ''}><input type="checkbox" data-automation-scope="${key}"> ${value}</label>`).join('') + '</fieldset>' +
            '<p data-automation-modern hidden>Gespeicherte Freigaben gelten auch nach einem Neustart. Änderst du diese Rechte, ist eine neue Freigabe nötig.</p><p>Entwicklerzugriff auf Repository oder Shell ist nicht enthalten.</p>' +
            '<div class="desktop-automation-actions"><button type="button" class="ez-knopf" data-automation-apply>Übernehmen</button><button type="button" class="ez-knopf" data-automation-test>Status aktualisieren</button><button type="button" class="ez-knopf" data-automation-disconnect>Alle Freigaben widerrufen</button><button type="button" class="ez-knopf" data-automation-package>MCP-Paket öffnen</button></div>' +
            '<p data-automation-sessions></p><div data-automation-clients></div><details><summary>Verbindungsprotokoll</summary><pre data-automation-log></pre></details></section>';
    };
    const mount = (container) => {
        const root = container.querySelector('.desktop-automation'), desktop = window.RedionDesktop;
        if (!root || !desktop?.automationState)
            return;
        let dirty = false, supportsSavedClients = false, supportsVisual = false;
        const status = root.querySelector('[data-automation-status]');
        const refresh = async () => {
            if (!root.isConnected)
                return;
            try {
                const state = await desktop.automationState();
                if (!root.isConnected)
                    return;
                supportsSavedClients = typeof state.rememberClients === 'boolean' && typeof state.confirmCritical === 'boolean';
                supportsVisual = typeof state.confirmImages === 'boolean';
                root.querySelectorAll('[data-automation-modern]').forEach(el => el.hidden = !supportsSavedClients);
                root.querySelectorAll('[data-automation-visual]').forEach(el => el.hidden = !supportsVisual);
                status.textContent = state.enabled ? (state.connected ? 'Verbunden · ' + state.profile : state.pairing ? 'Einmalige Freigabe im Redion-Fenster bestätigen · ' + state.profile : 'Aktiviert · wartet auf einen freigegebenen MCP-Client · ' + state.profile) : 'Verbindung ausgeschaltet';
                if (!dirty) {
                    root.querySelectorAll('[data-automation-policy]').forEach(el => el.checked = !!state[el.dataset.automationPolicy]);
                    root.querySelectorAll('[data-automation-scope]').forEach(el => el.checked = state.scopes.includes(el.dataset.automationScope));
                }
                root.querySelector('[data-automation-sessions]').textContent = (state.sessions || []).map((s) => 'Programm: ' + s.client + ' · Sitzung: ' + s.id + ' · bis ' + new Date(s.expires).toLocaleTimeString()).join('\n') || 'Keine aktive Sitzung';
                const clients = root.querySelector('[data-automation-clients]');
                clients.replaceChildren();
                for (const client of state.trustedClients || []) {
                    const row = document.createElement('p'), label = document.createElement('span'), button = document.createElement('button');
                    label.textContent = client.client + ' · freigegeben am ' + new Date(client.approvedAt).toLocaleDateString() + ' ';
                    button.type = 'button';
                    button.className = 'ez-knopf';
                    button.textContent = 'Freigabe widerrufen';
                    button.addEventListener('click', async () => { await desktop.automationRevokeClient(client.id); await refresh(); });
                    row.append(label, button);
                    clients.append(row);
                }
                root.querySelector('[data-automation-log]').textContent = (state.activity || []).map((a) => a.time + ' ' + a.tool + ' ' + a.status + (a.code ? ' ' + a.code : '')).join('\n') || 'Noch keine Aktionen';
            }
            catch {
                status.textContent = 'Die native Verbindung ist hier nicht verfügbar.';
            }
        };
        root.addEventListener('change', () => { dirty = true; });
        root.querySelector('[data-automation-apply]').addEventListener('click', async () => {
            const read = (key) => root.querySelector(`[data-automation-policy="${key}"]`).checked;
            try {
                await desktop.automationConfigure({ enabled: read('enabled'), write: read('write'), allowLaunch: read('allowLaunch'),
                    ...(supportsSavedClients ? { rememberClients: read('rememberClients'), confirmCritical: read('confirmCritical') } : {}),
                    ...(supportsVisual ? { confirmImages: read('confirmImages') } : {}),
                    scopes: [...root.querySelectorAll('[data-automation-scope]:checked')].map(el => el.dataset.automationScope) });
                dirty = false;
                await refresh();
            }
            catch {
                status.textContent = 'Freigabe abgebrochen oder nicht sicher möglich. Bitte Einstellungen erneut prüfen.';
            }
        });
        root.querySelector('[data-automation-test]').addEventListener('click', () => { void refresh(); });
        root.querySelector('[data-automation-package]').addEventListener('click', async () => {
            try {
                await desktop.automationOpenPackage();
            }
            catch {
                status.textContent = 'MCP-Paket fehlt. Die neue Windows-Version oder das vorbereitete Plugin-Paket verwenden.';
            }
        });
        root.querySelector('[data-automation-disconnect]').addEventListener('click', async () => { await desktop.automationDisconnect(); await refresh(); });
        const off = desktop.onAutomationState(() => { if (root.isConnected)
            void refresh();
        else
            off(); });
        const observer = new MutationObserver(() => { if (!root.isConnected) {
            off();
            observer.disconnect();
        } });
        observer.observe(document.body, { childList: true, subtree: true });
        void refresh();
    };
    return { html, mount };
})();
