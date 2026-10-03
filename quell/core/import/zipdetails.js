"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/import/zipdetails.ts (npm run bauen:ts). */
const ZipDetails = (() => {
    const UTF8_BIT = 0x800;
    const VERSCHLUESSELT_BIT = 0x1;
    let tafel = null;
    const crc32Tafel = () => {
        if (tafel)
            return tafel;
        tafel = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++)
                c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            tafel[n] = c >>> 0;
        }
        return tafel;
    };
    const crc32Start = () => 0xFFFFFFFF;
    const crc32Weiter = (zwischen, bytes) => {
        const t = crc32Tafel();
        let c = zwischen >>> 0;
        for (let i = 0; i < bytes.length; i++)
            c = (t[(c ^ (bytes[i] ?? 0)) & 0xFF] ?? 0) ^ (c >>> 8);
        return c >>> 0;
    };
    const crc32Fertig = (zwischen) => ((zwischen ^ 0xFFFFFFFF) >>> 0);
    const crc32 = (bytes) => crc32Fertig(crc32Weiter(crc32Start(), bytes));
    const crc32Hex = (n) => (n >>> 0).toString(16).padStart(8, '0');
    const CP437_OBEN = 'ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»' +
        '░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀' +
        'αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ';
    const cp437 = (bytes) => {
        let s = '';
        for (let i = 0; i < bytes.length; i++) {
            const b = bytes[i] ?? 0;
            s += b < 0x80 ? String.fromCharCode(b) : (CP437_OBEN[b - 0x80] ?? '?');
        }
        return s;
    };
    const nameDecodieren = (bytes, flags) => {
        if ((flags & UTF8_BIT) !== 0)
            return new TextDecoder('utf-8').decode(bytes);
        let nurAscii = true;
        for (let i = 0; i < bytes.length; i++)
            if ((bytes[i] ?? 0) >= 0x80) {
                nurAscii = false;
                break;
            }
        if (nurAscii)
            return new TextDecoder('utf-8').decode(bytes);
        try {
            return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        }
        catch {
            return cp437(bytes);
        }
    };
    const istVerschluesselt = (flags) => (flags & VERSCHLUESSELT_BIT) !== 0;
    return { UTF8_BIT, VERSCHLUESSELT_BIT, crc32Tafel, crc32Start, crc32Weiter, crc32Fertig, crc32, crc32Hex,
        cp437, nameDecodieren, istVerschluesselt };
})();
window.ZipDetails = ZipDetails;
