/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/aufbau/device-integration.ts (npm run bauen:ts). */
/** Geräteadapter sind nur Türen zur bestehenden App, kein zweiter Speicher. */
const DeviceIntegration = (() => {
  type Incoming = { id: string; name: string; size: number };
  type Desktop = {
    platform: string; pending(): Promise<Incoming[]>; pick(): Promise<void>;
    read(id: string, offset: number): Promise<Uint8Array>; release(id: string): Promise<void>;
    saveBegin(name: string, size: number): Promise<string | null>;
    saveWrite(id: string, bytes: Uint8Array): Promise<void>; saveCommit(id: string): Promise<boolean>;
    saveCancel(id: string): Promise<void>; onFiles(callback: () => void): () => void;
    takeDestination?(): Promise<string | null>; onDestination?(callback: () => void): () => void;
  };
  /* Die Ziele der Windows-Sprungliste drücken dieselben Knöpfe wie die
     iPhone-Schnellaktionen; es gibt keinen zweiten Weg durch die App. */
  const ZIEL_KNOPF: Record<string, string> = {
    neu: 'btn-new-bottom', heute: 'hl-start', dokumente: 'hl-dok', lernen: 'hl-lernen'
  };
  const zielAbholen = async (): Promise<void> => {
    const ziel = await desktop()?.takeDestination?.();
    if (ziel && Object.hasOwn(ZIEL_KNOPF, ziel)) document.getElementById(ZIEL_KNOPF[ziel]!)?.click();
  };
  const desktop = (): Desktop | undefined => (globalThis as any).RedionDesktop;
  let started = false, draining = false;
  const esc = (value: unknown) => String(value ?? '').replace(/[&<>"']/g,
    char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

  const snapshot = () => {
    const native = !!(globalThis as any).RedionNativeDateien;
    const platform = desktop() ? 'Windows-App' : native ? 'iPhone-App' : 'Web / PWA';
    const disk = !Store.speichertNicht();
    const cloud = Wolke.zustand;
    const conflicts = Zusammen.offene().length;
    const sync = Wolke.neuAbgleichOffen() ? 'Entscheidung nach Wiederherstellung erforderlich'
      : conflicts ? conflicts + ' offene Konflikte – nichts still überschreiben'
      : cloud.fehler || cloud.fehlerDateien ? 'Abgleich fehlgeschlagen: ' + (cloud.fehler || cloud.fehlerDateien)
      : cloud.laeuft ? 'Abgleich läuft …'
      : !Wolke.abgleichErlaubt() ? 'Ausgeschaltet – nur lokal'
      : !Wolke.angemeldet() ? 'Nicht angemeldet'
      : !Wolke.hatSchluessel() ? 'Verschlüsselung entsperren'
      : !navigator.onLine ? 'Offline – Abgleich wartet'
      : cloud.letzter ? 'Letzter Abgleich: ' + new Date(cloud.letzter).toLocaleString('de-CH')
      : 'Eingerichtet – noch kein erfolgreicher Abgleich in dieser Sitzung';
    return { platform, disk, sync, conflicts, backup: Sicherung.stand(), version: Stand.inhalt };
  };

  const overview = (): string => {
    const state = snapshot();
    return '<div class="dev-overview">' +
      '<p class="dev-intro">Ein Redion auf deinen Geräten. Dokumente bleiben lokal; ein Geräteabgleich ist freiwillig.</p>' +
      '<dl><dt>Dieses Gerät</dt><dd>' + esc(state.platform) + '</dd>' +
      '<dt>Lokaler Speicher</dt><dd>' + (state.disk ? 'Dauerhafte Ablage verfügbar' : 'WARNUNG: nur Arbeitsspeicher – jetzt extern sichern') + '</dd>' +
      '<dt>Letzte vollständige Sicherung</dt><dd>' + (state.backup.wann
        ? esc(new Date(state.backup.wann).toLocaleString('de-CH')) + ' (' + esc(state.backup.art) + ')'
        : 'Keine vollständige Sicherung bekannt') + '</dd>' +
      '<dt>Geräteabgleich</dt><dd>' + esc(state.sync) + '</dd>' +
      '<dt>Web-Code-Stand</dt><dd><code>' + esc(state.version) + '</code></dd></dl>' +
      '<p>Gleicher Code bedeutet nicht automatisch gleiche Notizen. iPhone-App, Windows-App und Browser haben zunächst getrennte lokale Speicher.</p>' +
      '<div class="dev-actions"><button data-device="backup">Vollständig sichern</button>' +
      '<button data-device="restore">Sicherung übernehmen</button>' +
      '<button data-device="open">PDF oder Datei öffnen</button>' +
      '<button data-device="sync">Geräteabgleich einrichten</button></div>' +
      '<details><summary>Sicher zum anderen Gerät wechseln</summary><ol>' +
      '<li>Auf dem bisherigen Gerät eine vollständige Sicherung speichern. Mit Anhängen ist das eine .redion-Datei.</li>' +
      '<li>Die Datei außerhalb des App-Containers ablegen und auf das andere Gerät übertragen.</li>' +
      '<li>Dort „Sicherung übernehmen“ wählen. Vorschau lesen und bewusst Dazulegen oder Ersetzen wählen.</li>' +
      '<li>Notizen, PDFs und Anhänge prüfen. Die Original-Sicherung behalten.</li></ol>' +
      '<p>Dazulegen ist kein konfliktfreier Zwei-Wege-Abgleich: Bei gleichen Kennungen kann die Sicherungsfassung gewinnen. Nicht wiederholt zwischen Geräten hin- und herimportieren.</p></details>' +
      '<p class="dev-warning">Vor App-Updates extern sichern. Die bestehende App nicht löschen und App-ID bzw. Windows-Profil nicht wechseln.</p></div>';
  };

  const act = async (action: string) => {
    if (action === 'backup') await App.sicherungSpeichern();
    if (action === 'restore') App.sicherungLaden();
    if (action === 'open') {
      const bridge = desktop();
      if (bridge) { await bridge.pick(); await drain(); }
      else Werkzeuge.dateienLesen();
    }
    if (action === 'sync') WolkeFenster.dialog();
  };

  const save = async (blob: Blob, name: string) => {
    const bridge = desktop();
    if (!bridge) throw new Error('Windows-Dateibrücke fehlt.');
    const id = await bridge.saveBegin(name, blob.size);
    if (!id) throw new DOMException('Speichern abgebrochen. Es wurde nichts geschrieben.', 'AbortError');
    try {
      for (let offset = 0; offset < blob.size; offset += 1024 * 1024)
        await bridge.saveWrite(id, new Uint8Array(await blob.slice(offset, offset + 1024 * 1024).arrayBuffer()));
      if (!await bridge.saveCommit(id)) throw new Error('Speichern nicht bestätigt.');
    } catch (error) { await bridge.saveCancel(id).catch(() => {}); throw error; }
  };

  const importFile = async (file: File): Promise<void> => {
    if (Store.speichertNicht()) throw new Error('Die lokale Ablage ist nicht verfügbar. Erst sichern und den Speicherfehler beheben.');
    const choice = await Dialog.wahl({ titel: 'In Redion übernehmen?',
      text: file.name + ' – ' + Sicherung.groesse(file.size) +
        '\nDas Original bleibt unverändert. Eine Sicherung wird erst nach einer weiteren Vorschau eingespielt.',
      knoepfe: [{ id: 'open', text: 'Übernehmen' }, { id: '', text: 'Abbrechen' }] });
    if (choice !== 'open') return;
    if (/\.(redion|json)$/i.test(file.name)) {
      if (await App.importBackupFile(file) === 'failed') throw new Error('Die Sicherung wurde nicht vollständig übernommen.');
    } else if (await Werkzeuge.importFiles([file]) !== 1) throw new Error('Die Datei konnte nicht übernommen werden.');
    await Store.flush();
  };

  const drain = async () => {
    const bridge = desktop();
    if (!started || !bridge || draining) return;
    draining = true;
    try {
      for (const item of await bridge.pending()) {
        try {
          if (!Number.isSafeInteger(item.size) || item.size < 0 || item.size >= 4 * 1024 ** 3) throw new Error('Ungültige Dateigröße.');
          const chunks: BlobPart[] = [];
          let offset = 0;
          while (offset < item.size) {
            const bytes = new Uint8Array(await bridge.read(item.id, offset));
            if (!bytes.length || bytes.length > item.size - offset) throw new Error('Datei unvollständig gelesen.');
            chunks.push(new Blob([bytes])); offset += bytes.length;
          }
          await importFile(new File(chunks, item.name));
        } catch (error) {
          UI.banner('Datei nicht übernommen: ' + (error instanceof Error ? error.message : String(error)) +
            ' Das Original bleibt erhalten und kann erneut geöffnet werden.', 'fehler');
        } finally { await bridge.release(item.id); }
      }
    } finally { draining = false; }
  };

  const start = () => {
    if (started) return;
    started = true;
    const bridge = desktop();
    if (bridge) {
      (globalThis as any).RedionNativeSicherung = Object.freeze({ speichern: save,
        ort: 'Sicherung am gewählten Windows-Speicherort gespeichert.' });
      (globalThis as any).RedionNativeDateien = Object.freeze({ speichern: save,
        ort: 'Datei am gewählten Windows-Speicherort gespeichert.' });
      bridge.onFiles(() => { void drain().catch(report); });
      bridge.onDestination?.(() => { void zielAbholen().catch(report); });
      void zielAbholen().catch(report);
      window.addEventListener('focus', () => { void drain().catch(report); });
      void drain().catch(report);
    }
    document.addEventListener('click', event => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-device]') : null;
      if (!target) return;
      void act(target.dataset.device || '').catch(report).finally(refresh);
    });
    Wolke.beiAenderung(refresh);
    Register.befehle.melde({ gruppe: 'Geräte', titel: 'iPhone, Windows und Sicherungen',
      tun: () => Einstellungen.oeffne('geraete') });
  };
  const refresh = () => {
    // Nur die Statuszeilen erneuern, nicht die fokussierte Schaltfläche,
    // aufgeklappte Anleitung oder vorhandene Dokumentoberflächen.
    const current = document.querySelector('.dev-overview dl');
    if (!current) return;
    const template = document.createElement('template');
    template.innerHTML = overview();
    const next = template.content.querySelector('dl');
    if (next && next.innerHTML !== current.innerHTML) current.replaceWith(next);
  };
  const report = (error: unknown) => UI.banner(error instanceof Error ? error.message : String(error), 'fehler');
  return { start, snapshot, overview, importFile, save };
})();
