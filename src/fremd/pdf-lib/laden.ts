/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/fremd/pdf-lib/laden.ts (npm run bauen:ts). */

type PdfKopieSeite = {
  getRotation(): { angle: number };
  setRotation(rotation: { angle: number }): void;
};
type PdfKopieDokument = {
  getPageCount(): number;
  copyPages(source: PdfKopieDokument, indices: number[]): Promise<PdfKopieSeite[]>;
  addPage(page: PdfKopieSeite): void;
  save(options: { updateFieldAppearances: boolean }): Promise<Uint8Array<ArrayBuffer>>;
};
type PdfLibApi = {
  PDFDocument: {
    load(bytes: ArrayBuffer): Promise<PdfKopieDokument>;
    create(): Promise<PdfKopieDokument>;
  };
  degrees(angle: number): { angle: number };
};

const PdfOriginal = (() => {
  const MAX_BYTES = 128 * 1024 * 1024;
  const MAX_PAGES = 1000;
  const MAX_FILES = 20;
  let wartet: Promise<PdfLibApi> | undefined;

  const api = () => (globalThis as typeof globalThis & { PDFLib?: PdfLibApi }).PDFLib;
  const laden = (): Promise<PdfLibApi> => {
    const bereit = api();
    if (bereit) return Promise.resolve(bereit);
    if (wartet) return wartet;
    wartet = new Promise<PdfLibApi>((resolve, reject) => {
      const eingebettet = document.getElementById('redion-pdf-lib')?.textContent;
      const bytes = eingebettet ? Uint8Array.from(atob(eingebettet.trim()), zeichen => zeichen.charCodeAt(0)) : null;
      const blobUrl = bytes ? URL.createObjectURL(new Blob([bytes], { type: 'text/javascript' })) : null;
      const script = document.createElement('script');
      script.src = blobUrl || 'quell/fremd/pdf-lib/library.js';
      const abschliessen = () => {
        script.remove();
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        const bibliothek = api();
        if (bibliothek) resolve(bibliothek);
        else reject(new Error('Die PDF-Werkzeuge konnten nicht geladen werden.'));
      };
      script.addEventListener('load', abschliessen, { once: true });
      script.addEventListener('error', abschliessen, { once: true });
      document.head.appendChild(script);
    }).catch(error => {
      wartet = undefined;
      throw error;
    });
    return wartet;
  };

  /** Einbasierte, geordnete Auswahl. Absteigende Bereiche und Wiederholungen sind erlaubt. */
  const seitenleser = (eingabe: string, anzahl: number): number[] => {
    const auswahl = eingabe.trim();
    if (!Number.isSafeInteger(anzahl) || anzahl < 1 || auswahl.length > 8000)
      throw new Error('Die PDF-Seitenauswahl ist ungültig.');
    if (auswahl === '*') {
      if (anzahl > MAX_PAGES) throw new Error('Eine Seitenkopie darf höchstens ' + MAX_PAGES + ' Seiten enthalten.');
      return Array.from({ length: anzahl }, (_, index) => index);
    }
    const ergebnis: number[] = [];
    for (const teil of auswahl.split(',')) {
      const treffer = /^([1-9]\d{0,5})(?:\s*[-–]\s*([1-9]\d{0,5}))?$/.exec(teil.trim());
      if (!treffer) throw new Error('Seiten mit Kommas und Bereichen angeben, etwa 1–3, 7, 5–4.');
      const start = Number(treffer[1]);
      const ende = Number(treffer[2] ?? treffer[1]);
      if (start > anzahl || ende > anzahl) throw new Error('Das Original hat ' + anzahl + ' Seiten.');
      const laenge = Math.abs(ende - start) + 1;
      if (ergebnis.length + laenge > MAX_PAGES) throw new Error('Zu viele Seiten ausgewählt.');
      for (let offset = 0; offset < laenge; offset++)
        ergebnis.push(start - 1 + offset * Math.sign(ende - start));
    }
    return ergebnis;
  };

  const zusammenstellen = async (
    quellDateien: { datei: Blob; auswahl: string }[], drehung = 0
  ): Promise<Blob> => {
    if (![0, 90, 180, 270].includes(drehung)) throw new Error('Diese Seitendrehung ist ungültig.');
    if (!quellDateien.length || quellDateien.length > MAX_FILES ||
        quellDateien.reduce((gesamt, quelle) => gesamt + quelle.datei.size, 0) > MAX_BYTES)
      throw new Error('Höchstens ' + MAX_FILES + ' PDF-Dateien und 128 MiB zusammenstellen.');
    const pdf = await laden();
    const ziel = await pdf.PDFDocument.create();
    let seitenGesamt = 0;
    for (const { datei, auswahl } of quellDateien) {
      let quelle: PdfKopieDokument;
      try { quelle = await pdf.PDFDocument.load(await datei.arrayBuffer()); }
      catch { throw new Error('Ein PDF liess sich nicht lesen. Prüfe die Datei und ihren Passwortschutz.'); }
      const indices = seitenleser(auswahl, quelle.getPageCount());
      seitenGesamt += indices.length;
      if (seitenGesamt > MAX_PAGES) throw new Error('Die neue PDF-Datei hätte zu viele Seiten.');
      for (const seite of await ziel.copyPages(quelle, indices)) {
        if (drehung) seite.setRotation(pdf.degrees((seite.getRotation().angle + drehung) % 360));
        ziel.addPage(seite);
      }
    }
    return new Blob([await ziel.save({ updateFieldAppearances: false })], { type: 'application/pdf' });
  };
  return { seitenleser, zusammenstellen };
})();
