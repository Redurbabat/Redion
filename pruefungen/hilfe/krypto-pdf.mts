/* Ein PASSWORTGESCHÜTZTES PDF von Hand — nur für den Prüfstand.
 * ----------------------------------------------------------------------------
 * Standard-Sicherheitshandler, V=1/R=2, RC4 mit 40 Bit. Das ist die älteste
 * und einfachste Form, und pdf.js kann sie; etwas Modernes (AES) zu bauen
 * hiesse, den halben Standard nachzuschreiben, ohne dass die Prüfung dadurch
 * mehr wüsste. Was hier geprüft wird, ist die FRAGE nach dem Passwort — nicht
 * die Güte der Verschlüsselung.
 *
 * RC4 steht hier, weil Node es seit Langem nicht mehr mitbringt. Fünfzehn
 * Zeilen, und sie gehören ausdrücklich NICHT in Redion: dort wird nichts
 * verschlüsselt, dort wird nur gelesen.
 * ==========================================================================*/
import crypto from 'node:crypto';

const PAD = Buffer.from([
  0x28, 0xBF, 0x4E, 0x5E, 0x4E, 0x75, 0x8A, 0x41, 0x64, 0x00, 0x4E, 0x56,
  0xFF, 0xFA, 0x01, 0x08, 0x2E, 0x2E, 0x00, 0xB6, 0xD0, 0x68, 0x3E, 0x80,
  0x2F, 0x0C, 0xA9, 0xFE, 0x64, 0x53, 0x69, 0x7A]);

const rc4 = (schluessel: Buffer, daten: Buffer): Buffer => {
  const s = new Uint8Array(256);
  for (let i = 0; i < 256; i++) s[i] = i;
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + s[i]! + schluessel[i % schluessel.length]!) & 255;
    [s[i], s[j]] = [s[j]!, s[i]!];
  }
  const aus = Buffer.alloc(daten.length);
  let i = 0; j = 0;
  for (let k = 0; k < daten.length; k++) {
    i = (i + 1) & 255;
    j = (j + s[i]!) & 255;
    [s[i], s[j]] = [s[j]!, s[i]!];
    aus[k] = daten[k]! ^ s[(s[i]! + s[j]!) & 255]!;
  }
  return aus;
};

const md5 = (b: Buffer): Buffer => crypto.createHash('md5').update(b).digest();
const gefuellt = (pw: string): Buffer =>
  Buffer.concat([Buffer.from(pw, 'latin1'), PAD]).subarray(0, 32);

/** Ein PDF mit Passwort. `seiten` sind die Zeilen je Seite. */
export const machGeschuetztesPdf = (
  seiten: string[][], nutzerPasswort: string, besitzerPasswort = nutzerPasswort
): Buffer => {
  const kennung = crypto.createHash('md5').update('redion-pruefstand').digest();
  const P = -1;                       /* alles erlaubt */
  const pLe = Buffer.alloc(4); pLe.writeInt32LE(P, 0);

  const O = rc4(md5(gefuellt(besitzerPasswort)).subarray(0, 5),
                gefuellt(nutzerPasswort));
  const schluessel = md5(Buffer.concat([
    gefuellt(nutzerPasswort), O, pLe, kennung])).subarray(0, 5);
  const U = rc4(schluessel, PAD);

  /** Der Schlüssel FÜR EIN OBJEKT — Objekt- und Gennummer gehen mit ein. */
  const objSchluessel = (nr: number, gen = 0): Buffer => {
    const b = Buffer.alloc(5);
    b.writeUIntLE(nr, 0, 3); b.writeUIntLE(gen, 3, 2);
    return md5(Buffer.concat([schluessel, b])).subarray(0, Math.min(5 + 5, 16));
  };

  const alsText = (s: string): string =>
    s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  const objekte: Buffer[] = [];
  const neu = (c: Buffer | string): number => {
    objekte.push(Buffer.isBuffer(c) ? c : Buffer.from(c, 'latin1'));
    return objekte.length;
  };

  const seitenNr = neu('');
  const schrift = neu('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const kids: number[] = [];
  for (const zeilen of seiten) {
    const strom: string[] = [];
    let y = 760;
    for (const z of zeilen) {
      strom.push(`BT /F1 22 Tf 60 ${y} Td (${alsText(z)}) Tj ET`); y -= 40; }
    strom.push('2 w 30 30 535 782 re S');
    const klar = Buffer.from(strom.join('\n'), 'latin1');
    /* Die Objektnummer steht erst nach `neu` fest — der Strom bekommt also
       eine vorher berechnete Nummer. `objekte.length + 1` ist sie. */
    const stromNr = objekte.length + 1;
    const geheim = rc4(objSchluessel(stromNr), klar);
    const inhalt = neu(Buffer.concat([
      Buffer.from(`<< /Length ${geheim.length} >>\nstream\n`, 'latin1'), geheim,
      Buffer.from('\nendstream', 'latin1')]));
    kids.push(neu('<< /Type /Page /Parent 1 0 R /MediaBox [0 0 595 842] ' +
      `/Resources << /Font << /F1 ${schrift} 0 R >> >> /Contents ${inhalt} 0 R >>`));
  }
  objekte[seitenNr - 1] = Buffer.from(
    `<< /Type /Pages /Count ${kids.length} /Kids [${kids.map(k => k + ' 0 R').join(' ')}] >>`,
    'latin1');
  const wurzel = neu(`<< /Type /Catalog /Pages ${seitenNr} 0 R >>`);
  const hexO = O.toString('hex'), hexU = U.toString('hex');
  const verschluss = neu(
    `<< /Filter /Standard /V 1 /R 2 /Length 40 /P ${P} ` +
    `/O <${hexO}> /U <${hexU}> >>`);

  let aus = Buffer.from('%PDF-1.4\n', 'latin1');
  const stellen: number[] = [];
  objekte.forEach((o, i) => {
    stellen.push(aus.length);
    aus = Buffer.concat([aus, Buffer.from(`${i + 1} 0 obj\n`, 'latin1'), o,
                         Buffer.from('\nendobj\n', 'latin1')]);
  });
  const xref = aus.length;
  let tab = `xref\n0 ${objekte.length + 1}\n0000000000 65535 f \n`;
  stellen.forEach(s => { tab += String(s).padStart(10, '0') + ' 00000 n \n'; });
  const hexId = kennung.toString('hex');
  tab += `trailer\n<< /Size ${objekte.length + 1} /Root ${wurzel} 0 R ` +
         `/Encrypt ${verschluss} 0 R /ID [<${hexId}> <${hexId}>] >>\n` +
         `startxref\n${xref}\n%%EOF\n`;
  return Buffer.concat([aus, Buffer.from(tab, 'latin1')]);
};
