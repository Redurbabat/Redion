/*
 * Redion iOS – begrenzter Speicherverbrauch beim nativen Backup.
 * Eine .redion-Datei kann mehrere Gigabyte gross sein. Niemals das
 * ganze Blob als Base64 in den JavaScript-Arbeitsspeicher laden.
 */
export async function* basis64Scheiben(blob, scheibe = 256 * 1024) {
  if (!(blob instanceof Blob)) throw new TypeError('Eine Sicherung muss ein Blob sein.');
  if (!Number.isSafeInteger(scheibe) || scheibe < 1 || scheibe > 4 * 1024 * 1024) {
    throw new RangeError('Ungueltige Scheibengroesse.');
  }

  for (let start = 0; start < blob.size; start += scheibe) {
    const bytes = new Uint8Array(
      await blob.slice(start, Math.min(start + scheibe, blob.size)).arrayBuffer()
    );
    let binaer = '';
    for (let i = 0; i < bytes.length; i += 8192) {
      binaer += String.fromCharCode(...bytes.subarray(i, i + 8192));
    }
    yield btoa(binaer);
  }
}
