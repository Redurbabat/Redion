/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/pdf/automatisierung.ts (npm run bauen:ts). */
/** Vorhandene importierte PDF öffnen; kein Zugriff auf freie lokale Dateipfade. */
RegisterAutomatisierung.melde('redion_open_pdf',(a,c)=>{
  const b=c.block(a.blockId);if(b.type!=='pdfseite'||!b.quelleId)c.error('INVALID_PDF');
  const p=c.pageOf(b.id);App.oeffne(p.id);
  if(DocumentMode.available(p))DocumentMode.select(p,b.id);
  return {documentId:p.id,blockId:b.id};
});
