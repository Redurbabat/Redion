/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/bloecke/arten/relais-werkstatt.ts (npm run bauen:ts). */
/* ============================================================================
 * bereiche/bloecke/arten/relais-werkstatt.ts — das Fach „Relais" (E769)
 * ----------------------------------------------------------------------------
 * Aus Redurs ZIP vom 1. November 2026, getypt und nach Redions Regeln:
 * Bestätigungen über `Dialog.bestaetigen` statt `window.confirm` (E710),
 * jede Änderung am Plan über `aendere` der Fläche — also rückgängig zu
 * machen —, jeder Text durch `esc` (§19).
 *
 * Was man hier tut: eine von Redurs zehn Original-Schaltungen einsetzen,
 * eine eigene .sch (+ .txt) einlesen, die Originalbytes wieder sichern, die
 * 30 Spaltentitel bearbeiten, die Verdrahtung nach eigener Prüfung
 * freigeben, oder eines der zwei verdrahteten Lehrbeispiele nehmen.
 *
 * Wird NICHT beim Start geladen (mit `relais-kern.js` und
 * `relais-vorlagen.js`, siehe `relaisLaden` in planflaeche.ts).
 * ==========================================================================*/

const RelaisWerkstatt = (() => {

  type Optionen = {
    element: HTMLElement;
    holePlan: () => any;
    aendere: (was: () => void) => void;
    setzePlan: (plan: any) => void;
  };

  const esc = (s: unknown): string => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const herunterladen = (daten: BlobPart, name: string, typ: string): void => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([daten], { type: typ }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  };
  const dateiname = (s: string): string => (s || 'Relais-Schaltung').replace(/[\\/:*?"<>|]/g, '_');

  const erstelle = (opt: Optionen): { aktualisiere: () => void } => {
    const el = opt.element;
    const vorlagen: ReadonlyArray<{ name: string; sch: string; txt: string }> = (window as any).RelaisVorlagen ?? [];
    let wahl = 0;
    let hinweis = '';
    let schDatei: File | null = null, txtDatei: File | null = null;

    const ersetzen = async (plan: any): Promise<void> => {
      const alt = opt.holePlan();
      if ((alt.teile.length || alt.leitungen.length || alt.texte.length) &&
          !await Dialog.bestaetigen({ titel: 'Schaltung ersetzen?',
            text: 'Der jetzige Plan wird ersetzt. Mit „Rückgängig" holst du ihn zurück.', ja: 'Ersetzen' })) return;
      opt.aendere(() => opt.setzePlan(plan));
      hinweis = plan.relaisLegacy
        ? 'Geladen. Die Verdrahtung der alten Datei ist nicht entschlüsselt — prüfe die Leitungen, bevor du sie freigibst.'
        : 'Geladen. Dieses Lehrbeispiel ist verdrahtet und sofort simulierbar.';
      aktualisiere();
    };

    const originalSichern = (): void => {
      const m = opt.holePlan().relaisLegacy;
      if (!m || !m.roh) return;
      herunterladen(RelaisKern.ausBase64(m.roh) as BlobPart, dateiname(m.name) + '.sch', 'application/octet-stream');
      const text = (m.texte as string[]).map(x => '[' + String(x).replace(/[[\]]/g, '') + ']').join('');
      herunterladen((m.txtRoh && !m.texteBearbeitet ? RelaisKern.ausBase64(m.txtRoh) : new TextEncoder().encode(text)) as BlobPart,
        dateiname(m.name) + '.txt', 'text/plain');
    };

    const aktualisiere = (): void => {
      const legacy = opt.holePlan().relaisLegacy;
      let html =
        '<div class="sp-bat-kopf"><strong>Relais-Werkstatt</strong><span>Redurs Relais-Schaltungen</span></div>' +
        '<div class="sp-bat-bedienung"><label>Schaltung <select data-rel="wahl">' +
        vorlagen.map((v, i) => `<option value="${i}"${wahl === i ? ' selected' : ''}>${esc(v.name)}</option>`).join('') +
        '</select></label><button type="button" data-rel="einsetzen">Einsetzen</button></div>' +
        '<div class="sp-bat-bedienung">' +
        '<button type="button" data-rel="lehr-selbsthaltung">Verdrahtet: Selbsthaltung</button>' +
        '<button type="button" data-rel="lehr-treppenhaus">Verdrahtet: Treppenhaus mit Zeitrelais</button></div>' +
        '<p class="sp-bat-hinweis">Die zehn Schaltungen sind die Originaldateien aus dem Programm „Relais". ' +
        'Ihre Leitungsführung ist nicht entschlüsselt: eingesetzt stehen die Bauteile an ihrem Platz, ' +
        'die kurzen Striche sind <b>Lagehinweise</b>, keine Verbindungen.</p>' +
        '<div class="sp-bat-bedienung"><label>Eigene .sch <input type="file" data-rel-datei="sch" accept=".sch"></label>' +
        '<label>Spaltentitel .txt (freiwillig) <input type="file" data-rel-datei="txt" accept=".txt"></label>' +
        '<button type="button" data-rel="import">Einlesen</button></div>';
      if (legacy) {
        html += `<p class="sp-bat-hinweis"><strong>${esc(legacy.name)}</strong> · ` +
          (legacy.verifiziert ? 'Verdrahtung freigegeben' : 'Verdrahtung noch nicht geprüft') + '</p>' +
          '<div class="sp-bat-bedienung"><button type="button" data-rel="original">Originaldateien sichern (.sch, .txt)</button>' +
          (legacy.verifiziert ? '' : '<button type="button" data-rel="freigeben">Verdrahtung freigeben …</button>') + '</div>' +
          '<details class="sp-rel-spalten"><summary>Spaltentitel bearbeiten (30)</summary>' +
          '<form data-rel-form="spalten"><div class="sp-rel-raster">' +
          (legacy.texte as string[]).map((t, i) =>
            `<label>Spalte ${i + 1}<input name="spalte-${i}" maxlength="200" value="${esc(t)}"></label>`).join('') +
          '</div><button class="prim" type="submit">Übernehmen</button></form></details>';
      }
      if (hinweis) html += `<p class="sp-bat-hinweis" role="status">${esc(hinweis)}</p>`;
      el.innerHTML = html;
    };

    el.addEventListener('submit', e => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement) || form.dataset.relForm !== 'spalten') return;
      e.preventDefault();
      const p = opt.holePlan();
      if (!p.relaisLegacy) return;
      const neu: Array<[number, string]> = [];
      for (let i = 0; i < 30; i++) {
        const feld = form.elements.namedItem('spalte-' + i);
        if (!(feld instanceof HTMLInputElement)) continue;
        const t = feld.value.trim().slice(0, 200);
        if (t !== String(p.relaisLegacy.texte[i] ?? '')) neu.push([i, t]);
      }
      if (!neu.length) { hinweis = 'Keine Spaltentitel geändert.'; aktualisiere(); return; }
      opt.aendere(() => neu.forEach(([i, t]) => RelaisKern.spalteBeschriften(opt.holePlan(), i, t)));
      hinweis = neu.length + ' Spaltentitel geändert. Die Originalbytes bleiben, wie sie waren.';
      aktualisiere();
    });
    el.addEventListener('change', e => {
      const t = e.target as HTMLInputElement | HTMLSelectElement;
      if (t.dataset.rel === 'wahl') { wahl = Number(t.value) || 0; return; }
      const datei = t instanceof HTMLInputElement ? t.files?.[0] ?? null : null;
      if (t.dataset.relDatei === 'sch') schDatei = datei;
      if (t.dataset.relDatei === 'txt') txtDatei = datei;
    });
    el.addEventListener('click', e => {
      const b = (e.target as Element).closest<HTMLElement>('[data-rel]');
      if (!b || b.tagName === 'SELECT') return;
      const art = b.dataset.rel;
      void (async () => {
        try {
          if (art === 'einsetzen') {
            const v = vorlagen[wahl];
            if (v) await ersetzen(RelaisKern.vorlage(v));
          } else if (art === 'lehr-selbsthaltung') await ersetzen(RelaisKern.lehrbeispiel('selbsthaltung'));
          else if (art === 'lehr-treppenhaus') await ersetzen(RelaisKern.lehrbeispiel('treppenhaus'));
          else if (art === 'import') {
            if (!schDatei) { hinweis = 'Bitte zuerst eine .sch-Datei wählen.'; aktualisiere(); return; }
            const sch = RelaisKern.leseSch(await schDatei.arrayBuffer());
            const txt = txtDatei ? new Uint8Array(await txtDatei.arrayBuffer()) : null;
            await ersetzen(RelaisKern.neutralerPlan(sch, txt ? RelaisKern.leseText(txt) : null,
              schDatei.name.replace(/\.sch$/i, ''), txt ? RelaisKern.zuBase64(txt) : ''));
          } else if (art === 'original') originalSichern();
          else if (art === 'freigeben') {
            if (!await Dialog.bestaetigen({ titel: 'Verdrahtung freigeben?',
              text: 'Du bestätigst, dass du Leitungen, Klemmen und Versorgung selbst geprüft und berichtigt hast. ' +
                'Erst dann rechnet die Simulation diesen Plan.', ja: 'Freigeben' })) return;
            opt.aendere(() => { opt.holePlan().relaisLegacy.verifiziert = true; });
            hinweis = 'Freigegeben. Die Verdrahtung des Originals ist damit nicht bewiesen — sie ist deine.';
            aktualisiere();
          }
        } catch (err) {
          hinweis = 'Fehler: ' + String((err as Error)?.message || err);
          aktualisiere();
        }
      })();
    });
    aktualisiere();
    return { aktualisiere };
  };

  return { erstelle };
})();

(window as any).RelaisWerkstatt = RelaisWerkstatt;
