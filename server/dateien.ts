/* ============================================================================
 * server/dateien.ts — Anhänge in der Wolke: Metadaten in D1, Bytes in R2
 * ----------------------------------------------------------------------------
 * G2 aus AUFGABEN.md. Die Regel dahinter ist E2: grosse Dateien gehören
 * nicht in D1. Deshalb zwei Ablagen — die Metadaten (Name, Grösse, Seite,
 * Stückzahl) liegen als Sätze in der Tabelle `dateien`, die Bytes liegen
 * stückweise unter `bereich/dateiId/nr` in einem Blob-Speicher: R2 in der
 * Wolke, eine Map im Prüfserver (`blobsSpeicher`).
 *
 * FÜNF WEGE, alle POST, alle mit Token (das Tor steht in kern.ts):
 *
 *   /datei/melden   Metadaten anlegen oder erneuern — vor den Bytes
 *   /datei/stueck   ein Stück hochladen (Base64, höchstens 2 MB roh)
 *   /datei/runter   ein Stück holen
 *   /datei/stand    was der Server hat, seit einer Marke — für den Abgleich
 *   /datei/weg      Datei löschen: Metadaten als geloescht, Stücke weg
 *
 * RECHTE laufen wie beim Abgleich über die SEITE, zu der die Datei gehört:
 * hochladen und löschen braucht `bearbeiten`, holen braucht `lesen`. Der
 * Besitzer des Bereichs darf alles.
 *
 * DIE MARKE von /datei/stand rückt mit dem GELESENEN vor, nicht mit dem
 * Durchgelassenen — dieselbe Lehre wie bei /sync/runter: wer viele fremde
 * Dateien vor sich hat, muss an ihnen vorbeikommen.
 *
 * VERSCHLÜSSELUNG ist Sache des Geräts: wer seine Sätze verschlüsselt,
 * verschlüsselt auch seine Stücke, bevor sie hierher gehen. Der Server
 * merkt sich nur das Flag und gibt die Bytes unverändert zurück.
 * ==========================================================================*/

import type { Ablage, Umwelt } from './typen.ts';
import { antwort, fehler, jetzt, darf, rolleAuf, irgendeinRecht } from './kern.ts';
import { darfMarke, rechteVon } from './sicherheit/marken.ts';
import { text as feldText } from './sicherheit/eingaben.ts';

const MB = 1024 * 1024;

/** Höchstgrösse einer einzelnen Datei. 100 MB reichen für Fotos, PDFs und
 *  kurze Videos; wer mehr braucht, wartet auf mehrteilige Uploads mit
 *  eigener Entscheidung. Die Zahl steht in E33 — hier nur der Riegel. */
export const DATEI_GRENZE = 100 * MB;

/** Höchstgrösse eines Stücks in rohen Bytes. Das Gerät schneidet bei 1 MB
 *  (`KONSTANTEN.STUECK`); die doppelte Grenze lässt Luft, ohne dass ein
 *  einzelner Aufruf den Arbeitsspeicher eines Workers füllt. */
export const STUECK_GRENZE = 2 * MB;

const bytesAusBase64 = (b64: string): Uint8Array | null => {
  try {
    const bin = atob(b64);
    const raus = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) raus[i] = bin.charCodeAt(i);
    return raus;
  } catch { return null; }
};

const base64AusBytes = (bytes: Uint8Array): string => {
  let bin = '';
  /* In Scheiben, sonst platzt `String.fromCharCode(...alles)` am
     Argument-Limit der Maschine. */
  for (let i = 0; i < bytes.length; i += 0x8000)
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};

export const dateiWeg = async (_a: unknown, ablage: Ablage, umwelt: Umwelt,
                               wer: any, t: string[], m: string, k: any) => {
  const blobs = umwelt.blobs ?? null;
  if (!blobs) return fehler(503, 'service_unavailable',
    'Für Anhänge fehlt der Dateispeicher. In der Wolke: R2-Bucket anlegen und ' +
    'in wrangler.toml binden — die Schritte stehen in SERVER-EINRICHTEN.md.');

  if (m !== 'POST') return fehler(405, 'method_not_allowed', 'Hier geht nur POST.');

  /* Regel 3 für Marken, hier statt im Tor: alle fünf Wege sind POST, die
     Methode verrät also nichts. Holen und Stand sind Lesen, der Rest ist
     Schreiben. Für eine Sitzung ist `darfMarke` immer wahr. */
  const brauchtRecht = (t[1] === 'runter' || t[1] === 'stand') ? 'lesen' : 'schreiben';
  if (!darfMarke(wer, brauchtRecht)) return fehler(403, 'restricted_resource',
    'Diese Marke darf nicht ' + brauchtRecht + '. Ihre Rechte: ' +
    (rechteVon(wer).join(', ') || 'keine') + '.');

  const bereichId = String(k.bereich || '');
  const bereich = await ablage.hole('bereiche', { id: bereichId });
  if (!bereich) return fehler(404, 'object_not_found', 'Diesen Bereich gibt es nicht.');
  if (!(await irgendeinRecht(ablage, bereichId, wer.konto.id)))
    return fehler(403, 'restricted_resource', 'In diesem Bereich hast du kein einziges Recht.');
  const besitzer = wer.konto.id === bereich.besitzer;

  const rechtAuf = async (seite: string, was: 'lesen' | 'bearbeiten') => {
    if (besitzer) return true;
    const r = await rolleAuf(ablage, bereichId, seite, wer.konto.id);
    return darf(r, was);
  };

  /* --- Metadaten anlegen oder erneuern --------------------------------- */
  if (t[1] === 'melden') {
    const d = k.datei || {};
    const id = String(d.id || '');
    if (!id) return fehler(400, 'validation_error', 'Die Datei braucht eine Kennung.');
    const groesse = Number(d.groesse) || 0;
    if (groesse <= 0) return fehler(400, 'validation_error', 'Die Grösse fehlt.');
    if (groesse > DATEI_GRENZE) return fehler(413, 'zu_viel',
      `Die Datei ist grösser als ${Math.round(DATEI_GRENZE / MB)} MB — dafür ist ` +
      'dieser Weg nicht gebaut. Sichere sie als .redion-Datei.');
    const teile = Math.max(1, Number(d.teile) || 1);
    if (teile > Math.ceil(DATEI_GRENZE / (MB / 2)))
      return fehler(400, 'validation_error', 'So viele Stücke ergeben keine erlaubte Datei.');
    const seite = String(d.seite || id);
    if (!(await rechtAuf(seite, 'bearbeiten')))
      return fehler(403, 'restricted_resource', 'Kein Schreibrecht auf dieser Seite.');

    const alt = await ablage.hole('dateien', { bereich: bereichId, id });
    await ablage.setze('dateien', {
      id, bereich: bereichId,
      name: feldText(d.name, 'dateiName'),
      groesse, typ: String(d.typ || '').slice(0, 100), seite, teile,
      verschluesselt: d.verschluesselt ? 1 : 0,
      version: alt ? (Number(alt.version) || 1) + 1 : 1,
      geaendert: jetzt(), geloescht: 0
    });
    return antwort(200, { ok: true }, { 'Access-Control-Allow-Origin': '*' });
  }

  /* --- Ein Stück hochladen --------------------------------------------- */
  if (t[1] === 'stueck') {
    const dateiId = String(k.dateiId || '');
    const nr = Number(k.nr);
    const meta = await ablage.hole('dateien', { bereich: bereichId, id: dateiId });
    if (!meta || meta.geloescht) return fehler(404, 'object_not_found',
      'Erst /datei/melden — der Server nimmt keine Bytes zu einer Datei, die er nicht kennt.');
    if (!Number.isInteger(nr) || nr < 0 || nr >= Number(meta.teile))
      return fehler(400, 'validation_error',
        `Stück ${nr} passt nicht zu einer Datei mit ${meta.teile} Stücken.`);
    if (!(await rechtAuf(String(meta.seite), 'bearbeiten')))
      return fehler(403, 'restricted_resource', 'Kein Schreibrecht auf dieser Seite.');
    const bytes = bytesAusBase64(String(k.base64 || ''));
    if (!bytes || !bytes.length) return fehler(400, 'validation_error', 'Das Stück ist leer oder kein Base64.');
    if (bytes.length > STUECK_GRENZE) return fehler(413, 'zu_viel',
      `Ein Stück darf höchstens ${Math.round(STUECK_GRENZE / MB)} MB roh sein.`);
    await blobs.lege(`${bereichId}/${dateiId}/${nr}`, bytes);
    return antwort(200, { ok: true, nr }, { 'Access-Control-Allow-Origin': '*' });
  }

  /* --- Ein Stück holen -------------------------------------------------- */
  if (t[1] === 'runter') {
    const dateiId = String(k.dateiId || '');
    const nr = Number(k.nr) || 0;
    const meta = await ablage.hole('dateien', { bereich: bereichId, id: dateiId });
    if (!meta || meta.geloescht) return fehler(404, 'object_not_found', 'Diese Datei gibt es hier nicht.');
    if (!(await rechtAuf(String(meta.seite), 'lesen')))
      return fehler(403, 'restricted_resource', 'Kein Leserecht auf dieser Seite.');
    const bytes = await blobs.hole(`${bereichId}/${dateiId}/${nr}`);
    if (!bytes) return fehler(404, 'object_not_found',
      `Stück ${nr} liegt hier nicht — vielleicht ist der Upload nie fertig geworden.`);
    return antwort(200, { nr, base64: base64AusBytes(bytes) },
      { 'Access-Control-Allow-Origin': '*' });
  }

  /* --- Der Stand für den Abgleich --------------------------------------- */
  if (t[1] === 'stand') {
    const seit = String(k.seit || '');
    const alle = await ablage.finde('dateien', { bereich: bereichId },
      { ...(seit ? { geaendertNach: seit } : {}),
        sortiere: 'geaendert', grenze: Number(k.grenze) || 200 });
    const raus = [];
    for (const d of alle) {
      if (!(await rechtAuf(String(d.seite), 'lesen'))) continue;
      raus.push({ id: d.id, name: d.name, groesse: d.groesse, typ: d.typ,
        seite: d.seite, teile: d.teile, verschluesselt: !!d.verschluesselt,
        version: d.version, geaendert: d.geaendert, geloescht: !!d.geloescht });
    }
    /* Dieselbe Lehre wie in /sync/runter: die Marke rückt mit dem
       Gelesenen vor, sonst kommt niemand an fremden Dateien vorbei. */
    const letzter = alle[alle.length - 1];
    const neueste = letzter ? letzter.geaendert : seit;
    return antwort(200, { dateien: raus, marke: neueste,
      mehr: alle.length >= (Number(k.grenze) || 200) },
      { 'Access-Control-Allow-Origin': '*' });
  }

  /* --- Löschen ----------------------------------------------------------- */
  if (t[1] === 'weg') {
    const dateiId = String(k.dateiId || '');
    const meta = await ablage.hole('dateien', { bereich: bereichId, id: dateiId });
    if (!meta) return fehler(404, 'object_not_found', 'Diese Datei gibt es hier nicht.');
    if (!(await rechtAuf(String(meta.seite), 'bearbeiten')))
      return fehler(403, 'restricted_resource', 'Kein Schreibrecht auf dieser Seite.');
    for (let nr = 0; nr < Number(meta.teile); nr++)
      await blobs.weg(`${bereichId}/${dateiId}/${nr}`);
    /* Die Metadaten bleiben als Grabstein — der Abgleich der anderen Geräte
       muss vom Löschen erfahren, sonst laden sie die Datei ewig neu hoch. */
    await ablage.setze('dateien', { ...meta, geloescht: 1,
      version: (Number(meta.version) || 1) + 1, geaendert: jetzt() });
    return antwort(200, { ok: true }, { 'Access-Control-Allow-Origin': '*' });
  }

  return fehler(404, 'object_not_found', 'Diesen Datei-Weg gibt es nicht: /datei/' + (t[1] || ''));
};
