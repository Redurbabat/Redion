/* ============================================================================
 * bereiche/wissen/lebensbereiche.ts — Lebensbereiche als Sichten auf Bestand
 * ----------------------------------------------------------------------------
 * Schule, Ausbildung, Universität, Arbeit und Privat sind keine eigenen
 * Speicher. Eine Zuordnung ist ein kleines Metafeld am bereits vorhandenen
 * Block, an der Sammlung oder an der Datei. Alle Listen in dieser Datei sind
 * daraus neu berechnete Sichten; sie dürfen jederzeit verworfen werden.
 *
 * Zwei ältere Formen bleiben absichtlich lesbar:
 *
 *   Store.getMeta('bereiche')   die schon vorhandenen Bereichsdefinitionen
 *   block.bereich               die bisherige einzelne Seitenzuordnung
 *
 * Nichts wird beim Lesen umgeschrieben. Erst `zuordnen` bzw. `entfernen`
 * ändern ein Objekt, und auch dann bleiben fremde Metafelder unangetastet.
 * ==========================================================================*/

const Lebensbereiche = (() => {
  type BereichArt = 'schule' | 'ausbildung' | 'uni' | 'arbeit' | 'privat' |
    'weiterbildung' | 'frei';
  type ObjektArt = 'page' | 'block' | 'collection' | 'file';
  type Aktion = 'lesen' | 'bearbeiten';

  type Bereich = {
    id: string;
    name: string;
    icon: string;
    art: BereichArt;
    created: string;
    edited: string;
  };

  type BereichEingabe = {
    id?: string;
    name: string;
    icon?: string;
    art?: BereichArt;
    pageId?: string;
  };

  type ObjektRef = { art: ObjektArt; id: string };
  type Aufloesung = { ref: ObjektRef; satz: any };

  type FilterOptionen = {
    bereichIds?: string[];
    limit?: number;
    von?: string | number | Date;
    bis?: string | number | Date;
    jetzt?: string | number | Date;
    einschliesslichErledigt?: boolean;
    nurMeine?: boolean;
  };

  type AggregatBasis = {
    ref: ObjektRef;
    titel: string;
    pageId: string;
    bereichIds: string[];
    zeit: string;
  };

  type AufgabenEintrag = AggregatBasis & {
    art: 'aufgabe';
    erledigt: boolean;
    status: string;
    faellig: string;
    ueberfaellig: boolean;
    collectionId: string;
  };

  type TerminEintrag = AggregatBasis & {
    art: 'termin';
    beginn: string;
    ende: string;
    collectionId: string;
  };

  type ProjektEintrag = AggregatBasis & {
    art: 'projekt';
    status: string;
    faellig: string;
  };

  type PdfEintrag = AggregatBasis & {
    art: 'pdf';
    dateiId: string;
    seitenzahl: number;
  };

  type Sm2Zustand = {
    ease?: number;
    intervall?: number;
    wdh?: number;
    faellig?: string;
    zuletzt?: string;
  };

  type LernzustandQuelle = 'extern' | 'eingebettet' | 'legacy' | 'leer';
  type Lernzustand = {
    version: 1;
    cardId: string;
    actorId: string;
    algorithm: 'sm2';
    sr: Sm2Zustand;
    reviewVerlauf: Record<string, any>;
    quelle: LernzustandQuelle;
    updatedAt: string;
  };

  type LernzustandEntitaet = {
    version: 1;
    id: string;
    cardId: string;
    actorId: string;
    algorithm: 'sm2';
    sr: Sm2Zustand;
    reviewVerlauf: Record<string, any>;
    updatedAt: string;
  };

  type LernzustandSpeicher = {
    version: 1;
    entities: Record<string, LernzustandEntitaet>;
  };

  type LernkarteEintrag = AggregatBasis & {
    art: 'lernkarte';
    neu: boolean;
    faellig: boolean;
    fehler: boolean;
    faelligAm: string;
    zustand: Lernzustand;
  };

  const META_KEY = 'lebensbereiche';
  /** Eingebettete Fassung bleibt ausschließlich als lesbare Kompatibilität. */
  const LERN_KEY = 'lernzustaende';
  /** Persönliche Zustände leben getrennt vom kanonischen Karteninhalt. */
  const LERN_STORE_KEY = 'persoenlicheLernzustaende';
  const LERN_STORE_VERSION = 1;
  const MAX_BEREICHE = 64;
  const MAX_ZUORDNUNGEN = 32;
  const MAX_BESTEHENDE_ZUORDNUNGEN = 1024;
  const MAX_ERGEBNISSE = 200;
  const MAX_SCAN = 50000;
  const MAX_AKTOREN = 128;
  const MAX_LERNZUSTAENDE = 10000;
  const MAX_REVIEWS = 500;
  const MAX_SM2_EASE = 10;
  const MAX_SM2_INTERVALL = 365000;
  const MAX_SM2_WDH = 1000000;
  const BEREICH_ARTEN = new Set<BereichArt>([
    'schule', 'ausbildung', 'uni', 'arbeit', 'privat', 'weiterbildung', 'frei'
  ]);

  const alsObjekt = (wert: unknown): Record<string, any> =>
    wert !== null && typeof wert === 'object' && !Array.isArray(wert)
      ? wert as Record<string, any> : {};

  const text = (wert: unknown, max = 160): string =>
    String(wert ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

  const idText = (wert: unknown, max = 180): string => text(wert, max);

  const zeitZahl = (wert: unknown): number => {
    const sicher = (zahl: number): number =>
      Number.isFinite(zahl) && Math.abs(zahl) <= 8640000000000000 ? zahl : 0;
    if (wert instanceof Date) return sicher(wert.getTime());
    if (typeof wert === 'number') return sicher(wert);
    const zahl = Date.parse(String(wert || ''));
    return sicher(zahl);
  };

  const iso = (wert: unknown): string => {
    const zahl = zeitZahl(wert);
    return zahl ? new Date(zahl).toISOString() : '';
  };

  /** YYYY-MM-DD ist ein Kalendertag, nicht Mitternacht in UTC. */
  const datumsZahl = (wert: unknown): number => {
    const roh = wert && typeof wert === 'object'
      ? (wert as any).start ?? (wert as any).date ?? (wert as any).from
      : wert;
    const s = String(roh || '').trim();
    const tag = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (tag) {
      const jahr = Number(tag[1]), monat = Number(tag[2]) - 1, datum = Number(tag[3]);
      const d = new Date(jahr, monat, datum);
      return d.getFullYear() === jahr && d.getMonth() === monat && d.getDate() === datum
        ? d.getTime() : 0;
    }
    return zeitZahl(roh);
  };

  const datumsIso = (wert: unknown): string => {
    const zahl = datumsZahl(wert);
    return zahl ? new Date(zahl).toISOString() : '';
  };

  const grenze = (wert: unknown, vorgabe: number): number => {
    const zahl = datumsZahl(wert);
    return zahl || vorgabe;
  };

  const limitVon = (wert: unknown): number => {
    const zahl = Math.floor(Number(wert));
    return Number.isFinite(zahl) ? Math.max(1, Math.min(MAX_ERGEBNISSE, zahl)) : 50;
  };

  const eindeutig = (werte: unknown, max = MAX_ZUORDNUNGEN): string[] => {
    const raus: string[] = [];
    const gesehen = new Set<string>();
    const liste = Array.isArray(werte) ? werte : werte === undefined || werte === null ? [] : [werte];
    for (const wert of liste) {
      const id = idText(wert);
      if (!id || gesehen.has(id)) continue;
      gesehen.add(id);
      raus.push(id);
      if (raus.length >= max) break;
    }
    return raus;
  };

  const jetztIso = (): string => typeof Store.now === 'function'
    ? String(Store.now()) : new Date().toISOString();

  /* Siehe `kern/zugang/lesefrage.ts` — dieselbe Frage stand hier und in
     `arbeitswelt.ts` je einmal, mit zwei Antworten (L50, E181). */
  const rightsActive = (): boolean => Lesefrage.aktiv();

  const erlaubt = (aktion: Aktion, pageId: string): boolean =>
    Lesefrage.erlaubt(aktion, pageId);

  const globalBearbeitbar = (pageId = ''): boolean => {
    if (!rightsActive()) return true;
    return pageId ? Konten.darf('bearbeiten', pageId) : Konten.darf('bearbeiten');
  };

  const artVon = (wert: unknown): BereichArt => {
    const art = text(wert, 32) as BereichArt;
    return BEREICH_ARTEN.has(art) ? art : 'frei';
  };

  const normalisiereBereich = (roh: any): Bereich | null => {
    const id = idText(roh?.id), name = text(roh?.name, 80);
    if (!id || !name) return null;
    return {
      id,
      name,
      icon: text(roh?.icon || '◫', 8) || '◫',
      art: artVon(roh?.art),
      created: iso(roh?.created),
      edited: iso(roh?.edited)
    };
  };

  /** Bestehende Definitionen werden nur gelesen und nie beim Listen bereinigt. */
  const auflisten = (): Bereich[] => {
    const roh = Store.getMeta('bereiche', []);
    const raus: Bereich[] = [];
    const gesehen = new Set<string>();
    for (const eintrag of Array.isArray(roh) ? roh : []) {
      const bereich = normalisiereBereich(eintrag);
      if (!bereich || gesehen.has(bereich.id)) continue;
      gesehen.add(bereich.id);
      raus.push(bereich);
      if (raus.length >= MAX_BEREICHE) break;
    }
    return raus.sort((a, b) => a.name.localeCompare(b.name, 'de-CH') ||
      a.id.localeCompare(b.id));
  };

  const hashKurz = (wert: string): string => {
    let h = 2166136261;
    for (let i = 0; i < wert.length; i++) {
      h ^= wert.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  };

  const bereichIdAus = (name: string): string => {
    const slug = name.toLocaleLowerCase('de-CH').normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      .slice(0, 50) || 'bereich';
    return 'bereich-' + slug + '-' + hashKurz(name);
  };

  /** Gleicher Name ohne explizite Kennung ergibt wieder denselben Bereich. */
  const anlegen = (eingabe: BereichEingabe): Bereich => {
    const name = text(eingabe?.name, 80);
    if (!name) throw new Error('Ein Bereich braucht einen Namen.');
    if (!globalBearbeitbar(idText(eingabe?.pageId)))
      throw new Error('Du darfst hier keinen Bereich anlegen.');

    const roh = Store.getMeta('bereiche', []);
    const liste: any[] = Array.isArray(roh) ? [...roh] : [];
    const id = idText(eingabe?.id) || bereichIdAus(name);
    const vorhanden = liste.find(eintrag => idText(eintrag?.id) === id) ||
      (!eingabe.id ? liste.find(eintrag => text(eintrag?.name, 80)
        .localeCompare(name, 'de-CH', { sensitivity: 'base' }) === 0) : null);
    if (vorhanden) {
      const normal = normalisiereBereich(vorhanden);
      if (!normal) throw new Error('Der vorhandene Bereich ist beschädigt.');
      if (eingabe.id && normal.name.localeCompare(name, 'de-CH', { sensitivity: 'base' }) !== 0)
        throw new Error('Diese Bereichskennung gehört bereits zu „' + normal.name + '“.');
      return normal;
    }
    if (liste.length >= MAX_BEREICHE)
      throw new Error('Mehr als ' + MAX_BEREICHE + ' Bereiche werden nicht angelegt.');

    const wann = jetztIso();
    const neu = {
      id,
      name,
      icon: text(eingabe.icon || '◫', 8) || '◫',
      art: artVon(eingabe.art),
      created: wann,
      edited: wann
    };
    liste.push(neu);
    Store.setMeta('bereiche', liste);
    return neu;
  };

  const collectionPageId = (collectionId: string): string => {
    const kandidaten = Object.values<any>(Store.cache.blocks).filter(block =>
      block?.alive !== false && block.type === 'database' && block.collectionId === collectionId);
    const block = kandidaten.find(kandidat => !kandidat.verknuepft) || kandidaten[0];
    return block ? blockPageId(block) : '';
  };

  const blockPageId = (block: any): string => {
    if (!block?.id) return '';
    if (block.type === 'page' && block.parentTable !== 'collection') return idText(block.id);
    if (block.parentTable === 'collection') return collectionPageId(idText(block.parentId));
    if (typeof Links !== 'undefined' && typeof Links.seiteVon === 'function')
      return idText(Links.seiteVon(block.id)?.id);
    let aktuell = block, schritte = 0;
    const gesehen = new Set<string>();
    while (aktuell && schritte++ < 50) {
      const id = idText(aktuell.id);
      if (!id || gesehen.has(id)) return '';
      gesehen.add(id);
      if (aktuell.type === 'page' && aktuell.parentTable !== 'collection') return id;
      aktuell = aktuell.parentTable === 'block' && aktuell.parentId
        ? Store.getBlock(idText(aktuell.parentId)) : null;
    }
    return '';
  };

  const pageIdVon = (aufloesung: Aufloesung): string => {
    if (aufloesung.ref.art === 'collection') return collectionPageId(aufloesung.ref.id);
    if (aufloesung.ref.art === 'file') {
      const block = aufloesung.satz?.blockId ? Store.getBlock(idText(aufloesung.satz.blockId)) : null;
      return block ? blockPageId(block) : '';
    }
    return blockPageId(aufloesung.satz);
  };

  const refAus = (eingabe: ObjektRef | string | any): ObjektRef | null => {
    if (typeof eingabe === 'string') {
      const id = idText(eingabe);
      if (!id) return null;
      const block = Store.getBlock(id);
      if (block) return { art: block.type === 'page' ? 'page' : 'block', id };
      if (Store.getCollection(id)) return { art: 'collection', id };
      return { art: 'file', id };
    }
    const id = idText(eingabe?.id);
    if (!id) return null;
    const art = text(eingabe?.art, 20) as ObjektArt;
    if (art === 'page' || art === 'block' || art === 'collection' || art === 'file')
      return { art, id };
    if (eingabe?.schema && Array.isArray(eingabe?.viewIds)) return { art: 'collection', id };
    if ('groesse' in alsObjekt(eingabe) && 'teile' in alsObjekt(eingabe)) return { art: 'file', id };
    return { art: eingabe?.type === 'page' ? 'page' : 'block', id };
  };

  /** Immer den kanonischen Satz holen; übergebene Kopien werden nie geschrieben. */
  const aufloesen = async (eingabe: ObjektRef | string | any): Promise<Aufloesung | null> => {
    const ref = refAus(eingabe);
    if (!ref) return null;
    if (ref.art === 'collection') {
      const satz = Store.getCollection(ref.id);
      return satz ? { ref, satz } : null;
    }
    if (ref.art === 'file') {
      const satz = await Store.dateiHolen(ref.id);
      return satz ? { ref, satz } : null;
    }
    const satz = Store.getBlock(ref.id);
    if (!satz || (ref.art === 'page' && satz.type !== 'page')) return null;
    return { ref: { art: satz.type === 'page' ? 'page' : 'block', id: ref.id }, satz };
  };

  const direkteBereichIds = (satz: any): string[] => {
    const meta = alsObjekt(satz?.meta);
    const ids = [
      ...(Array.isArray(meta[META_KEY]) ? meta[META_KEY] : []),
      ...(satz?.bereich ? [satz.bereich] : [])
    ];
    return eindeutig(ids, MAX_BESTEHENDE_ZUORDNUNGEN);
  };

  const sortiereBereichIds = (ids: Iterable<string>): string[] => {
    const reihenfolge = new Map<string, number>(auflisten()
      .map((bereich, index): [string, number] => [bereich.id, index]));
    return eindeutig([...ids], MAX_BESTEHENDE_ZUORDNUNGEN).sort((a, b) =>
      (reihenfolge.get(a) ?? Number.MAX_SAFE_INTEGER) -
      (reihenfolge.get(b) ?? Number.MAX_SAFE_INTEGER) || a.localeCompare(b));
  };

  const sammleBlockBereiche = (block: any, ziel: Set<string>, gesehen: Set<string>, tiefe = 0): void => {
    if (!block?.id || tiefe >= 50 || gesehen.has(idText(block.id))) return;
    gesehen.add(idText(block.id));
    direkteBereichIds(block).forEach(id => ziel.add(id));
    if (block.parentTable === 'collection') {
      const collection = Store.getCollection(idText(block.parentId));
      if (collection) sammleCollectionBereiche(collection, ziel, gesehen, tiefe + 1);
      return;
    }
    if (block.parentId) {
      const parent = Store.getBlock(idText(block.parentId));
      if (parent) sammleBlockBereiche(parent, ziel, gesehen, tiefe + 1);
    }
  };

  const sammleCollectionBereiche = (collection: any, ziel: Set<string>, gesehen: Set<string>, tiefe = 0): void => {
    if (!collection?.id || tiefe >= 50) return;
    const schluessel = 'collection:' + idText(collection.id);
    if (gesehen.has(schluessel)) return;
    gesehen.add(schluessel);
    direkteBereichIds(collection).forEach(id => ziel.add(id));
    const kandidaten = Object.values<any>(Store.cache.blocks).filter(block =>
      block?.alive !== false && block.type === 'database' && block.collectionId === collection.id);
    const block = kandidaten.find(kandidat => !kandidat.verknuepft) || kandidaten[0];
    if (block) sammleBlockBereiche(block, ziel, gesehen, tiefe + 1);
  };

  const bereichIdsDerAufloesung = (aufloesung: Aufloesung): string[] => {
    const ziel = new Set<string>(), gesehen = new Set<string>();
    direkteBereichIds(aufloesung.satz).forEach(id => ziel.add(id));
    if (aufloesung.ref.art === 'collection')
      sammleCollectionBereiche(aufloesung.satz, ziel, gesehen);
    else if (aufloesung.ref.art === 'file') {
      const block = aufloesung.satz?.blockId ? Store.getBlock(idText(aufloesung.satz.blockId)) : null;
      if (block) sammleBlockBereiche(block, ziel, gesehen);
    } else sammleBlockBereiche(aufloesung.satz, ziel, gesehen);
    return sortiereBereichIds(ziel);
  };

  const bereicheVon = async (eingabe: ObjektRef | string | any): Promise<Bereich[]> => {
    const aufloesung = await aufloesen(eingabe);
    if (!aufloesung || !erlaubt('lesen', pageIdVon(aufloesung))) return [];
    const ids = new Set(bereichIdsDerAufloesung(aufloesung));
    return auflisten().filter(bereich => ids.has(bereich.id));
  };

  const metaPatch = (satz: any, ids: string[]): Record<string, any> => {
    const meta = { ...alsObjekt(satz?.meta) };
    if (ids.length) meta[META_KEY] = ids;
    else delete meta[META_KEY];
    return { meta };
  };

  const schreibeZuordnung = async (aufloesung: Aufloesung, ids: string[],
                                    legacyEntfernen = ''): Promise<void> => {
    const patch = metaPatch(aufloesung.satz, ids);
    if (legacyEntfernen && idText(aufloesung.satz?.bereich) === legacyEntfernen)
      patch.bereich = '';
    if (aufloesung.ref.art === 'collection') {
      Store.updateCollection(aufloesung.ref.id, patch);
      return;
    }
    if (aufloesung.ref.art === 'file') {
      await Store.dateiPut({ ...aufloesung.satz, ...patch, edited: jetztIso() });
      return;
    }
    Store.updateBlock(aufloesung.ref.id, patch);
  };

  const zuordnen = async (eingabe: ObjektRef | string | any, bereichId: string): Promise<string[]> => {
    const id = idText(bereichId);
    if (!auflisten().some(bereich => bereich.id === id))
      throw new Error('Dieser Bereich existiert nicht.');
    const aufloesung = await aufloesen(eingabe);
    if (!aufloesung) throw new Error('Das Objekt wurde nicht gefunden.');
    if (!erlaubt('bearbeiten', pageIdVon(aufloesung)))
      throw new Error('Du darfst dieses Objekt nicht zuordnen.');
    const direkt = direkteBereichIds(aufloesung.satz);
    if (direkt.includes(id)) return sortiereBereichIds(direkt);
    if (direkt.length >= MAX_ZUORDNUNGEN)
      throw new Error('Ein Objekt kann höchstens ' + MAX_ZUORDNUNGEN + ' Bereichen zugeordnet werden.');
    const neu = sortiereBereichIds([...direkt, id]);
    await schreibeZuordnung(aufloesung, neu);
    return neu;
  };

  const entfernen = async (eingabe: ObjektRef | string | any, bereichId: string): Promise<string[]> => {
    const id = idText(bereichId);
    const aufloesung = await aufloesen(eingabe);
    if (!aufloesung) throw new Error('Das Objekt wurde nicht gefunden.');
    if (!erlaubt('bearbeiten', pageIdVon(aufloesung)))
      throw new Error('Du darfst diese Zuordnung nicht entfernen.');
    const direkt = direkteBereichIds(aufloesung.satz);
    if (!direkt.includes(id)) return sortiereBereichIds(direkt);
    const neu = sortiereBereichIds(direkt.filter(eintrag => eintrag !== id));
    await schreibeZuordnung(aufloesung, neu, id);
    return neu;
  };

  const optionBereiche = (optionen: FilterOptionen): string[] =>
    eindeutig(optionen.bereichIds, MAX_BEREICHE);

  const passtBereich = (ids: string[], gesucht: string[]): boolean =>
    !gesucht.length || gesucht.some(id => ids.includes(id));

  const blocks = (): any[] => Object.values<any>(Store.cache.blocks)
    .filter(block => block?.alive !== false).slice(0, MAX_SCAN);

  const collections = (): any[] => Object.values<any>(Store.cache.collections).slice(0, MAX_SCAN);

  const lesbarBlock = (block: any): boolean => !!block && erlaubt('lesen', blockPageId(block));

  const lesbarCollection = (collection: any): boolean =>
    !!collection && erlaubt('lesen', collectionPageId(idText(collection.id)));

  const feldSichtbar = (collectionId: string, key: string): boolean =>
    typeof Feldrechte === 'undefined' || typeof Feldrechte.inKraft !== 'function' ||
    !Feldrechte.inKraft() || Feldrechte.darfSehen(collectionId, key);

  const sichtbareKeys = (collection: any, typen?: Set<string>): string[] =>
    Object.keys(alsObjekt(collection?.schema)).filter(key => {
      const definition = collection.schema[key];
      return feldSichtbar(idText(collection.id), key) &&
        (!typen || typen.has(text(definition?.type, 40)));
    });

  const titelDerZeile = (row: any, collection: any): string => {
    const titelKeys = Object.keys(alsObjekt(collection?.schema))
      .filter(key => text(collection.schema[key]?.type, 40) === 'title');
    const key = sichtbareKeys(collection, new Set(['title']))[0];
    if (titelKeys.length && !key) return 'Geschützter Eintrag';
    return text((key && row?.props?.[key]) || row?.text || 'Ohne Titel', 240) || 'Ohne Titel';
  };

  const titelVon = (aufloesung: Aufloesung): string => {
    if (aufloesung.ref.art === 'collection')
      return text(aufloesung.satz?.name || 'Datenbank', 240) || 'Datenbank';
    if (aufloesung.ref.art === 'file')
      return text(aufloesung.satz?.name || 'Datei', 240) || 'Datei';
    if (aufloesung.satz?.parentTable === 'collection') {
      const collection = Store.getCollection(idText(aufloesung.satz.parentId));
      if (collection) return titelDerZeile(aufloesung.satz, collection);
    }
    return text(aufloesung.satz?.text || 'Ohne Titel', 240) || 'Ohne Titel';
  };

  const basisVon = (aufloesung: Aufloesung, bereichIds?: string[]): AggregatBasis => ({
    ref: aufloesung.ref,
    titel: titelVon(aufloesung),
    pageId: pageIdVon(aufloesung),
    bereichIds: bereichIds || bereichIdsDerAufloesung(aufloesung),
    zeit: iso(aufloesung.satz?.zuletztGeoeffnet || aufloesung.satz?.edited ||
      aufloesung.satz?.fertigAm || aufloesung.satz?.angelegt || aufloesung.satz?.created)
  });

  const propsWert = (row: any, key: string): unknown =>
    feldSichtbar(idText(row?.parentId), key) ? row?.props?.[key] : undefined;

  const statusInfo = (row: any, collection: any): { erledigt: boolean; status: string } => {
    const haken = sichtbareKeys(collection, new Set(['checkbox']))[0];
    const status = sichtbareKeys(collection, new Set(['status']))[0];
    if (haken) {
      const erledigt = !!propsWert(row, haken);
      return { erledigt, status: erledigt ? 'Erledigt' : 'Offen' };
    }
    const wert = status ? text(propsWert(row, status), 100) : '';
    return { erledigt: /fertig|erledigt|done|abgeschlossen|complete/i.test(wert), status: wert || 'Offen' };
  };

  const ersteDatumsspalte = (row: any, collection: any): unknown => {
    const keys = sichtbareKeys(collection, new Set(['date', 'created', 'edited']));
    return keys.length ? propsWert(row, keys[0] as string) : undefined;
  };

  const eigenesObjekt = (row: any, collection: any): boolean => {
    const konto = typeof Konten !== 'undefined' && typeof Konten.aktiv === 'function'
      ? Konten.aktiv() : null;
    const name = text(konto?.name || 'Ich', 160).toLocaleLowerCase('de-CH');
    const allePersonen = Object.keys(alsObjekt(collection?.schema))
      .filter(key => text(collection.schema[key]?.type, 40) === 'person');
    const personen = allePersonen.filter(key => feldSichtbar(idText(collection.id), key));
    if (allePersonen.length && !personen.length) return false;
    /* DIESELBE REGEL WIE IN `bibliothek.ts`, und das ist der Punkt: zwei
       Listen, die „meine Aufgaben" verschieden beantworten, sind schlimmer
       als eine, die es schlecht tut (E147). Eine gefüllte Personenzelle sagt,
       wem die Zeile gehört; steht in keiner ein Name, gehört sie dem, der
       zusieht. Der Vergleich mit `erstelltVon` stand hier wie dort und war
       hier wie dort falsch — `Store.addRow` schrieb das Feld gar nicht
       (L56, E153). */
    const eingetragen = personen
      .map(key => text(propsWert(row, key), 500).toLocaleLowerCase('de-CH'))
      .filter(Boolean);
    if (!eingetragen.length) return true;
    return eingetragen.some(wert => wert.includes(name));
  };

  const aufgaben = async (optionen: FilterOptionen = {}): Promise<AufgabenEintrag[]> => {
    const gesucht = optionBereiche(optionen), limit = limitVon(optionen.limit);
    const now = grenze(optionen.jetzt, Date.now());
    const raus: AufgabenEintrag[] = [];

    for (const block of blocks()) {
      if (block.type !== 'todo' || !lesbarBlock(block)) continue;
      const aufloesung: Aufloesung = { ref: { art: 'block', id: idText(block.id) }, satz: block };
      const ids = bereichIdsDerAufloesung(aufloesung);
      if (!passtBereich(ids, gesucht)) continue;
      const erledigt = !!block.checked;
      if (erledigt && !optionen.einschliesslichErledigt) continue;
      const faellig = datumsIso(block.faellig || block.due || block.datum || block.date);
      raus.push({ ...basisVon(aufloesung, ids), art: 'aufgabe', erledigt,
        status: erledigt ? 'Erledigt' : 'Offen', faellig,
        ueberfaellig: !erledigt && !!faellig && zeitZahl(faellig) < now,
        collectionId: '' });
    }

    for (const collection of collections()) {
      if (!lesbarCollection(collection)) continue;
      const typen = Object.values<any>(alsObjekt(collection.schema)).map(def => text(def?.type, 40));
      if (!collection.istAufgaben && !typen.includes('checkbox') && !typen.includes('status')) continue;
      for (const row of Store.rowsOf(collection.id).slice(0, MAX_SCAN)) {
        if (!lesbarBlock(row) || (optionen.nurMeine && !eigenesObjekt(row, collection))) continue;
        const aufloesung: Aufloesung = { ref: { art: 'page', id: idText(row.id) }, satz: row };
        const ids = bereichIdsDerAufloesung(aufloesung);
        if (!passtBereich(ids, gesucht)) continue;
        const status = statusInfo(row, collection);
        if (status.erledigt && !optionen.einschliesslichErledigt) continue;
        const faellig = datumsIso(ersteDatumsspalte(row, collection));
        raus.push({ ...basisVon(aufloesung, ids), art: 'aufgabe', ...status, faellig,
          ueberfaellig: !status.erledigt && !!faellig && zeitZahl(faellig) < now,
          collectionId: idText(collection.id) });
      }
    }

    return raus.sort((a, b) => Number(a.erledigt) - Number(b.erledigt) ||
      (zeitZahl(a.faellig) || Number.MAX_SAFE_INTEGER) -
      (zeitZahl(b.faellig) || Number.MAX_SAFE_INTEGER) ||
      a.titel.localeCompare(b.titel, 'de-CH') || a.ref.id.localeCompare(b.ref.id)).slice(0, limit);
  };

  const istTerminCollection = (collection: any): boolean => {
    if (collection?.istKalender || collection?.istTermine || collection?.schoolKind === 'exams') return true;
    const name = text(collection?.name, 160);
    if (/termin|kalender|prüfung|pruefung|event|meeting/i.test(name)) return true;
    return (collection?.viewIds || []).some((id: string) => Store.getView(id)?.layout === 'calendar');
  };

  const termine = async (optionen: FilterOptionen = {}): Promise<TerminEintrag[]> => {
    const gesucht = optionBereiche(optionen), limit = limitVon(optionen.limit);
    const von = grenze(optionen.von, Number.MIN_SAFE_INTEGER);
    const bis = grenze(optionen.bis, Number.MAX_SAFE_INTEGER);
    const raus: TerminEintrag[] = [];

    for (const collection of collections()) {
      if (!lesbarCollection(collection) || !istTerminCollection(collection)) continue;
      const datumKeys = sichtbareKeys(collection, new Set(['date']));
      if (!datumKeys.length) continue;
      for (const row of Store.rowsOf(collection.id).slice(0, MAX_SCAN)) {
        if (!lesbarBlock(row)) continue;
        const wert = propsWert(row, datumKeys[0] as string);
        const startRaw = wert && typeof wert === 'object' ? (wert as any).start ?? (wert as any).date : wert;
        const endRaw = wert && typeof wert === 'object' ? (wert as any).end ?? startRaw : startRaw;
        const beginnZahl = datumsZahl(startRaw), endeZahl = datumsZahl(endRaw) || beginnZahl;
        if (!beginnZahl || endeZahl < von || beginnZahl > bis) continue;
        const aufloesung: Aufloesung = { ref: { art: 'page', id: idText(row.id) }, satz: row };
        const ids = bereichIdsDerAufloesung(aufloesung);
        if (!passtBereich(ids, gesucht)) continue;
        raus.push({ ...basisVon(aufloesung, ids), art: 'termin',
          beginn: new Date(beginnZahl).toISOString(), ende: new Date(endeZahl).toISOString(),
          collectionId: idText(collection.id) });
      }
    }

    for (const block of blocks()) {
      if (!['event', 'termin', 'calendar'].includes(text(block.type, 30)) || !lesbarBlock(block)) continue;
      const beginnZahl = datumsZahl(block.start || block.datum || block.date || block.faellig);
      const endeZahl = datumsZahl(block.end || block.ende) || beginnZahl;
      if (!beginnZahl || endeZahl < von || beginnZahl > bis) continue;
      const aufloesung: Aufloesung = { ref: { art: 'block', id: idText(block.id) }, satz: block };
      const ids = bereichIdsDerAufloesung(aufloesung);
      if (!passtBereich(ids, gesucht)) continue;
      raus.push({ ...basisVon(aufloesung, ids), art: 'termin',
        beginn: new Date(beginnZahl).toISOString(), ende: new Date(endeZahl).toISOString(), collectionId: '' });
    }

    return raus.sort((a, b) => zeitZahl(a.beginn) - zeitZahl(b.beginn) ||
      a.titel.localeCompare(b.titel, 'de-CH') || a.ref.id.localeCompare(b.ref.id)).slice(0, limit);
  };

  const dateienAlle = async (): Promise<any[]> => {
    try {
      const liste = await Store.dateiAlle();
      return Array.isArray(liste) ? liste.slice(0, MAX_SCAN) : [];
    } catch { return []; }
  };

  const zuletzt = async (optionen: FilterOptionen = {}): Promise<AggregatBasis[]> => {
    const gesucht = optionBereiche(optionen), limit = limitVon(optionen.limit);
    const raus: AggregatBasis[] = [];
    for (const block of blocks()) {
      if (block.type !== 'page' || block.parentTable === 'collection' || !lesbarBlock(block)) continue;
      const aufloesung: Aufloesung = { ref: { art: 'page', id: idText(block.id) }, satz: block };
      const ids = bereichIdsDerAufloesung(aufloesung);
      if (!passtBereich(ids, gesucht)) continue;
      raus.push(basisVon(aufloesung, ids));
    }
    for (const datei of await dateienAlle()) {
      const aufloesung: Aufloesung = { ref: { art: 'file', id: idText(datei.id) }, satz: datei };
      const pageId = pageIdVon(aufloesung);
      if (!erlaubt('lesen', pageId)) continue;
      const ids = bereichIdsDerAufloesung(aufloesung);
      if (!passtBereich(ids, gesucht)) continue;
      raus.push(basisVon(aufloesung, ids));
    }
    return raus.sort((a, b) => zeitZahl(b.zeit) - zeitZahl(a.zeit) ||
      a.titel.localeCompare(b.titel, 'de-CH') || a.ref.id.localeCompare(b.ref.id)).slice(0, limit);
  };

  const tagsVon = (satz: any): string[] => eindeutig([
    ...(Array.isArray(satz?.tags) ? satz.tags : []),
    ...(Array.isArray(satz?.schlagwoerter) ? satz.schlagwoerter : [])
  ], 64).map(tag => tag.replace(/^#/, '').toLocaleLowerCase('de-CH'));

  const istProjekt = (satz: any): boolean => {
    const meta = alsObjekt(satz?.meta);
    const art = text(meta.art || meta.kind || satz?.kind || satz?.rolle || satz?.systemRole, 60)
      .toLocaleLowerCase('de-CH');
    return satz?.istProjekt === true || satz?.projekt === true || art === 'projekt' || art === 'project' ||
      tagsVon(satz).some(tag => tag === 'projekt' || tag === 'project');
  };

  const projektStatus = (satz: any, collection?: any): string => {
    if (collection) {
      const key = sichtbareKeys(collection, new Set(['status', 'select']))[0];
      if (key) return text(propsWert(satz, key), 100);
    }
    return text(satz?.status, 100);
  };

  const projekte = async (optionen: FilterOptionen = {}): Promise<ProjektEintrag[]> => {
    const gesucht = optionBereiche(optionen), limit = limitVon(optionen.limit);
    const raus: ProjektEintrag[] = [];
    for (const collection of collections()) {
      if (!lesbarCollection(collection)) continue;
      if (istProjekt(collection)) {
        const aufloesung: Aufloesung = { ref: { art: 'collection', id: idText(collection.id) }, satz: collection };
        const ids = bereichIdsDerAufloesung(aufloesung);
        if (passtBereich(ids, gesucht))
          raus.push({ ...basisVon(aufloesung, ids), art: 'projekt', status: projektStatus(collection), faellig: '' });
      }
      for (const row of Store.rowsOf(collection.id).slice(0, MAX_SCAN)) {
        if (!lesbarBlock(row) || (!istProjekt(row) && !collection.istProjekte)) continue;
        const aufloesung: Aufloesung = { ref: { art: 'page', id: idText(row.id) }, satz: row };
        const ids = bereichIdsDerAufloesung(aufloesung);
        if (!passtBereich(ids, gesucht)) continue;
        raus.push({ ...basisVon(aufloesung, ids), art: 'projekt',
          status: projektStatus(row, collection), faellig: datumsIso(ersteDatumsspalte(row, collection)) });
      }
    }
    for (const block of blocks()) {
      if (block.parentTable === 'collection' || !istProjekt(block) || !lesbarBlock(block)) continue;
      const aufloesung: Aufloesung = { ref: { art: block.type === 'page' ? 'page' : 'block', id: idText(block.id) }, satz: block };
      const ids = bereichIdsDerAufloesung(aufloesung);
      if (!passtBereich(ids, gesucht)) continue;
      raus.push({ ...basisVon(aufloesung, ids), art: 'projekt', status: projektStatus(block),
        faellig: datumsIso(block.faellig || block.due || block.datum) });
    }
    const einmal = new Map<string, ProjektEintrag>();
    raus.forEach(eintrag => einmal.set(eintrag.ref.art + ':' + eintrag.ref.id, eintrag));
    return [...einmal.values()].sort((a, b) =>
      (zeitZahl(a.faellig) || Number.MAX_SAFE_INTEGER) -
      (zeitZahl(b.faellig) || Number.MAX_SAFE_INTEGER) ||
      zeitZahl(b.zeit) - zeitZahl(a.zeit) || a.ref.id.localeCompare(b.ref.id)).slice(0, limit);
  };

  const pdfs = async (optionen: FilterOptionen = {}): Promise<PdfEintrag[]> => {
    const gesucht = optionBereiche(optionen), limit = limitVon(optionen.limit);
    const gesammelt = new Map<string, PdfEintrag>();
    const seitenProPage = new Map<string, number>();
    blocks().filter(block => block.type === 'pdfseite').forEach(block => {
      const pageId = blockPageId(block);
      if (pageId) seitenProPage.set(pageId, (seitenProPage.get(pageId) || 0) + 1);
    });
    for (const block of blocks()) {
      const pdfSeite = block.type === 'pdfseite';
      const pdfDatei = /pdf/i.test(text(block.mime || block.typ || block.dateiTyp, 100)) ||
        /\.pdf$/i.test(text(block.name || block.dateiname, 240));
      if ((!pdfSeite && !pdfDatei) || !lesbarBlock(block)) continue;
      const pageId = blockPageId(block);
      const page = pageId ? Store.getBlock(pageId) : null;
      const satz = pdfSeite && page ? page : block;
      const ref: ObjektRef = { art: satz.type === 'page' ? 'page' : 'block', id: idText(satz.id) };
      const aufloesung: Aufloesung = { ref, satz };
      const ids = bereichIdsDerAufloesung(aufloesung);
      if (!passtBereich(ids, gesucht)) continue;
      const eintrag: PdfEintrag = { ...basisVon(aufloesung, ids), art: 'pdf',
        dateiId: idText(block.dateiId || block.bildDateiId), seitenzahl: seitenProPage.get(pageId) || 1 };
      const key = eintrag.dateiId ? 'file:' + eintrag.dateiId : 'page:' + (pageId || block.id);
      const alt = gesammelt.get(key);
      if (!alt || zeitZahl(eintrag.zeit) > zeitZahl(alt.zeit)) gesammelt.set(key, eintrag);
    }
    for (const datei of await dateienAlle()) {
      if (!/pdf/i.test(text(datei?.typ, 120)) && !/\.pdf$/i.test(text(datei?.name, 240))) continue;
      const aufloesung: Aufloesung = { ref: { art: 'file', id: idText(datei.id) }, satz: datei };
      if (!erlaubt('lesen', pageIdVon(aufloesung))) continue;
      const ids = bereichIdsDerAufloesung(aufloesung);
      if (!passtBereich(ids, gesucht)) continue;
      gesammelt.set('file:' + datei.id, { ...basisVon(aufloesung, ids), art: 'pdf',
        dateiId: idText(datei.id), seitenzahl: Math.max(0, Math.floor(Number(datei.seitenzahl) || 0)) });
    }
    return [...gesammelt.values()].sort((a, b) => zeitZahl(b.zeit) - zeitZahl(a.zeit) ||
      a.titel.localeCompare(b.titel, 'de-CH') || a.ref.id.localeCompare(b.ref.id)).slice(0, limit);
  };

  const actorIdSicher = (wert: unknown): string => {
    const id = idText(wert, 160);
    if (!/^[\p{L}\p{N}._:@+\/-]+$/u.test(id) ||
        id === '__proto__' || id === 'prototype' || id === 'constructor') return '';
    return id;
  };

  const aktuellerAktor = (): { id: string; art: 'account' | 'local'; stabil: boolean } => {
    const konto = typeof Konten !== 'undefined' && typeof Konten.aktiv === 'function'
      ? Konten.aktiv() : null;
    const kontoId = actorIdSicher(konto?.id);
    return kontoId ? { id: kontoId, art: 'account', stabil: true }
      : { id: 'local', art: 'local', stabil: false };
  };

  const reviewsAlsMap = (wert: unknown): Record<string, any> => {
    const paare: Array<[string, any]> = [];
    if (Array.isArray(wert)) wert.forEach((entry, index) => {
      if (!entry || typeof entry !== 'object') return;
      const id = idText((entry as any).id) || 'legacy-' + index + '-' + idText((entry as any).at);
      paare.push([id, { ...(entry as any), id }]);
    });
    else Object.entries(alsObjekt(wert)).forEach(([key, entry]) => {
      if (!entry || typeof entry !== 'object') return;
      const id = idText((entry as any).id || key);
      if (id) paare.push([id, { ...(entry as any), id }]);
    });
    paare.sort((a, b) => String(a[1].at || '').localeCompare(String(b[1].at || '')) ||
      a[0].localeCompare(b[0]));
    return Object.fromEntries(paare.slice(-MAX_REVIEWS));
  };

  const sm2 = (wert: unknown): Sm2Zustand => {
    const roh = alsObjekt(wert), raus: Sm2Zustand = {};
    const zahl = (key: 'ease' | 'intervall' | 'wdh'): void => {
      const n = Number(roh[key]);
      if (!Number.isFinite(n) || n < 0) return;
      const maximum = key === 'ease' ? MAX_SM2_EASE
        : key === 'intervall' ? MAX_SM2_INTERVALL : MAX_SM2_WDH;
      raus[key] = Math.min(maximum, n);
    };
    zahl('ease'); zahl('intervall'); zahl('wdh');
    const faellig = iso(roh.faellig), zuletzt = iso(roh.zuletzt);
    if (faellig) raus.faellig = faellig;
    if (zuletzt) raus.zuletzt = zuletzt;
    return raus;
  };

  /**
   * Kollisionsfreie, reproduzierbare Kennung. Die Längenangabe trennt Actor
   * und Karten-ID auch dann eindeutig, wenn eine der Kennungen Doppelpunkte
   * enthält. Karteninhalt wird weder in der Kennung noch in der Entität
   * dupliziert.
   */
  const lernzustandId = (cardId: string, actorId: string): string =>
    'v1:' + actorId.length + ':' + actorId + ':' + cardId;

  const normalisiereLernentitaet = (wert: unknown): LernzustandEntitaet | null => {
    const roh = alsObjekt(wert);
    const cardId = idText(roh.cardId), actorId = actorIdSicher(roh.actorId);
    if (Number(roh.version) !== 1 || !cardId || !actorId) return null;
    const id = lernzustandId(cardId, actorId);
    return {
      version: 1,
      id,
      cardId,
      actorId,
      algorithm: 'sm2',
      sr: sm2(roh.sr),
      reviewVerlauf: reviewsAlsMap(roh.reviewVerlauf),
      updatedAt: iso(roh.updatedAt || roh.edited)
    };
  };

  /**
   * Fremde oder beschädigte Felder werden beim Lesen ignoriert, aber nie
   * zurückgeschrieben. Doppelte Entitäten gewinnen reproduzierbar nach
   * Änderungszeit und ursprünglichem Schlüssel; Karten- und Gesamtgrenzen
   * werden ebenfalls in stabiler Reihenfolge angewandt.
   */
  const normalisiereLernspeicher = (wert: unknown): LernzustandSpeicher => {
    const envelope = alsObjekt(wert);
    if (Number(envelope.version) !== LERN_STORE_VERSION)
      return { version: LERN_STORE_VERSION, entities: {} };

    type Kandidat = { entitaet: LernzustandEntitaet; ursprung: string };
    const nachId = new Map<string, Kandidat>();
    const paare = Object.entries(alsObjekt(envelope.entities)).sort(([a], [b]) =>
      a < b ? -1 : a > b ? 1 : 0);
    for (const [ursprung, roh] of paare) {
      const entitaet = normalisiereLernentitaet(roh);
      if (!entitaet) continue;
      const alt = nachId.get(entitaet.id);
      const neuZeit = zeitZahl(entitaet.updatedAt), altZeit = zeitZahl(alt?.entitaet.updatedAt);
      if (!alt || neuZeit > altZeit || (neuZeit === altZeit && ursprung > alt.ursprung))
        nachId.set(entitaet.id, { entitaet, ursprung });
    }

    const jeKarte = new Map<string, LernzustandEntitaet[]>();
    for (const { entitaet } of nachId.values()) {
      const liste = jeKarte.get(entitaet.cardId) || [];
      liste.push(entitaet);
      jeKarte.set(entitaet.cardId, liste);
    }
    const begrenzt: LernzustandEntitaet[] = [];
    for (const cardId of [...jeKarte.keys()].sort()) {
      const liste = jeKarte.get(cardId) || [];
      liste.sort((a, b) => zeitZahl(b.updatedAt) - zeitZahl(a.updatedAt) ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      begrenzt.push(...liste.slice(0, MAX_AKTOREN));
    }
    begrenzt.sort((a, b) => zeitZahl(b.updatedAt) - zeitZahl(a.updatedAt) ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const entities = Object.fromEntries(begrenzt.slice(0, MAX_LERNZUSTAENDE)
      .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
      .map(entitaet => [entitaet.id, entitaet]));
    return { version: LERN_STORE_VERSION, entities };
  };

  const externerLernspeicher = (): LernzustandSpeicher =>
    normalisiereLernspeicher(Store.getMeta(LERN_STORE_KEY, null));

  const eingebetteteLernzustaende = (karte: any): Record<string, any> => {
    const meta = alsObjekt(karte?.meta), envelope = alsObjekt(meta[LERN_KEY]);
    return Number(envelope.version) === 1 ? alsObjekt(envelope.actors) : {};
  };

  const lernzustandAusEntitaet = (
    entitaet: LernzustandEntitaet,
    quelle: 'extern'
  ): Lernzustand => ({
    version: 1,
    cardId: entitaet.cardId,
    actorId: entitaet.actorId,
    algorithm: 'sm2',
    sr: sm2(entitaet.sr),
    reviewVerlauf: reviewsAlsMap(entitaet.reviewVerlauf),
    quelle,
    updatedAt: iso(entitaet.updatedAt)
  });

  const leererLernzustand = (cardId: string, actorId: string): Lernzustand => ({
    version: 1,
    cardId,
    actorId,
    algorithm: 'sm2',
    sr: {},
    reviewVerlauf: {},
    quelle: 'leer',
    updatedAt: ''
  });

  /**
   * Rein lesend und ohne Migration: zuerst der externe actor+card-Satz, dann
   * die frühere eingebettete Personenfassung. Nur der aktuelle Actor darf
   * zuletzt auf den alten lokalen Kartenstand zurückfallen; bei einer
   * fremden Actor-ID wäre derselbe Stand sonst zwei Personen zugeschrieben.
   */
  const lernzustandLesen = (karte: any, actorId?: string): Lernzustand => {
    const cardId = idText(karte?.id);
    const aktuell = aktuellerAktor();
    const actor = actorIdSicher(actorId === undefined ? aktuell.id : actorId);
    if (!cardId || !actor) return leererLernzustand(cardId, actor);

    const extern = externerLernspeicher().entities[lernzustandId(cardId, actor)];
    if (extern) return lernzustandAusEntitaet(extern, 'extern');

    /* Für Kompatibilitäts- und Legacy-Daten zählt stets die kanonische Karte,
       nicht eine vom Aufrufer veränderte Kopie. */
    const kanonisch = Store.getBlock(cardId) || karte;
    const person = eingebetteteLernzustaende(kanonisch)[actor];
    if (person && typeof person === 'object') {
      return { version: 1, cardId, actorId: actor, algorithm: 'sm2',
        sr: sm2(person.sr), reviewVerlauf: reviewsAlsMap(person.reviewVerlauf),
        quelle: 'eingebettet', updatedAt: iso(person.updatedAt || person.edited) };
    }
    if (actor === aktuell.id && (kanonisch?.sr || kanonisch?.reviewVerlauf)) {
      return { version: 1, cardId, actorId: actor, algorithm: 'sm2',
        sr: sm2(kanonisch.sr), reviewVerlauf: reviewsAlsMap(kanonisch.reviewVerlauf),
        quelle: 'legacy', updatedAt: iso(kanonisch?.sr?.zuletzt || kanonisch?.edited) };
    }
    return leererLernzustand(cardId, actor);
  };

  const lernzustandSchreiben = async (
    eingabe: ObjektRef | string | any,
    actorId: string,
    zustand: { sr?: Sm2Zustand; reviewVerlauf?: Record<string, any>; algorithm?: 'sm2' },
    optionen: { kompatibilitaetAlsBasis?: boolean; legacyAlsBasis?: boolean } = {}
  ): Promise<Lernzustand> => {
    const actor = actorIdSicher(actorId);
    if (!actor) throw new Error('Der Lernzustand braucht eine gültige Actor- oder Konto-Kennung.');
    const aufloesung = await aufloesen(eingabe);
    if (!aufloesung || aufloesung.satz?.type !== 'flashcard')
      throw new Error('Die Lernkarte wurde nicht gefunden.');
    if (!erlaubt('lesen', pageIdVon(aufloesung)))
      throw new Error('Du darfst diese Lernkarte nicht lesen.');
    if (zustand?.algorithm !== undefined && zustand.algorithm !== 'sm2')
      throw new Error('Dieser Lernalgorithmus wird nicht unterstützt.');

    const speicher = externerLernspeicher();
    const id = lernzustandId(aufloesung.ref.id, actor);
    const vorhanden = speicher.entities[id];
    if (!vorhanden) {
      const anKarte = Object.values(speicher.entities)
        .filter(entitaet => entitaet.cardId === aufloesung.ref.id).length;
      if (anKarte >= MAX_AKTOREN)
        throw new Error('Diese Karte hat bereits ' + MAX_AKTOREN + ' getrennte Lernzustände.');
      if (Object.keys(speicher.entities).length >= MAX_LERNZUSTAENDE)
        throw new Error('Der persönliche Lernspeicher hat seine Grenze von ' +
          MAX_LERNZUSTAENDE + ' Zuständen erreicht.');
    }

    /* Ein kompatibler Altstand wird nur auf ausdrückliche Anforderung Basis.
       Ein normales partielles Schreiben übernimmt ausschließlich den schon
       vorhandenen externen Zustand und löst daher keine stille Migration aus. */
    const expliziteBasis = optionen.kompatibilitaetAlsBasis === true ||
      optionen.legacyAlsBasis === true;
    const basis = vorhanden
      ? lernzustandAusEntitaet(vorhanden, 'extern')
      : expliziteBasis
        ? lernzustandLesen(aufloesung.satz, actor)
        : leererLernzustand(aufloesung.ref.id, actor);
    const reviewAnzahl = zustand.reviewVerlauf === undefined ? 0
      : Array.isArray(zustand.reviewVerlauf)
        ? zustand.reviewVerlauf.filter(entry => entry && typeof entry === 'object').length
        : Object.keys(alsObjekt(zustand.reviewVerlauf)).length;
    if (reviewAnzahl > MAX_REVIEWS)
      throw new Error('Ein Lernzustand darf höchstens ' + MAX_REVIEWS + ' Wiederholungen tragen.');
    const reviews = zustand.reviewVerlauf === undefined
      ? basis.reviewVerlauf : reviewsAlsMap(zustand.reviewVerlauf);
    const wann = jetztIso();
    const person = {
      version: 1 as const,
      actorId: actor,
      algorithm: 'sm2' as const,
      sr: zustand.sr === undefined ? basis.sr : sm2(zustand.sr),
      reviewVerlauf: reviews,
      updatedAt: wann
    };
    const entitaet: LernzustandEntitaet = {
      ...person,
      id,
      cardId: aufloesung.ref.id
    };
    const gespeichert = normalisiereLernspeicher({
      version: LERN_STORE_VERSION,
      entities: { ...speicher.entities, [id]: entitaet }
    });
    Store.setMeta(LERN_STORE_KEY, gespeichert);
    return { version: 1, cardId: aufloesung.ref.id, actorId: actor,
      algorithm: 'sm2', sr: person.sr, reviewVerlauf: reviews,
      quelle: 'extern', updatedAt: wann };
  };

  const letzteBewertung = (reviews: Record<string, any>): number => {
    const liste = Object.values<any>(reviews).sort((a, b) =>
      String(a?.at || '').localeCompare(String(b?.at || '')) ||
      String(a?.id || '').localeCompare(String(b?.id || '')));
    const note = Number(liste[liste.length - 1]?.rating);
    return Number.isFinite(note) ? note : 0;
  };

  const lernkarten = async (optionen: FilterOptionen = {}): Promise<LernkarteEintrag[]> => {
    const gesucht = optionBereiche(optionen), limit = limitVon(optionen.limit);
    const now = grenze(optionen.jetzt, Date.now());
    const actor = aktuellerAktor().id;
    const raus: LernkarteEintrag[] = [];
    for (const block of blocks()) {
      if (block.type !== 'flashcard' || !lesbarBlock(block)) continue;
      const aufloesung: Aufloesung = { ref: { art: 'block', id: idText(block.id) }, satz: block };
      const ids = bereichIdsDerAufloesung(aufloesung);
      if (!passtBereich(ids, gesucht)) continue;
      const zustand = lernzustandLesen(block, actor);
      const faelligAm = zustand.sr.faellig || '';
      const neu = zustand.quelle === 'leer' || (!Object.keys(zustand.sr).length &&
        !Object.keys(zustand.reviewVerlauf).length);
      const note = letzteBewertung(zustand.reviewVerlauf);
      raus.push({ ...basisVon(aufloesung, ids), art: 'lernkarte', neu,
        faellig: !neu && (!faelligAm || zeitZahl(faelligAm) <= now),
        fehler: note > 0 && note < 3, faelligAm, zustand });
    }
    return raus.sort((a, b) => Number(b.fehler) - Number(a.fehler) ||
      Number(b.faellig) - Number(a.faellig) || Number(b.neu) - Number(a.neu) ||
      (zeitZahl(a.faelligAm) || Number.MAX_SAFE_INTEGER) -
      (zeitZahl(b.faelligAm) || Number.MAX_SAFE_INTEGER) ||
      a.titel.localeCompare(b.titel, 'de-CH') || a.ref.id.localeCompare(b.ref.id)).slice(0, limit);
  };

  const lokalerTag = (wert: unknown): { start: number; end: number; id: string } => {
    const zahl = grenze(wert, Date.now()), d = new Date(zahl);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime() - 1;
    const id = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0')].join('-');
    return { start, end, id };
  };

  const heute = async (optionen: FilterOptionen = {}) => {
    const tag = lokalerTag(optionen.jetzt);
    const basisOptionen = { ...optionen, jetzt: tag.start, limit: limitVon(optionen.limit) };
    const [alleAufgaben, heutigeTermine, letzte, laufendeProjekte, letztePdfs, karten] = await Promise.all([
      aufgaben({ ...basisOptionen, limit: MAX_ERGEBNISSE, nurMeine: optionen.nurMeine ?? true }),
      termine({ ...basisOptionen, von: tag.start, bis: tag.end }),
      zuletzt(basisOptionen),
      projekte(basisOptionen),
      pdfs(basisOptionen),
      lernkarten({ ...basisOptionen, limit: MAX_ERGEBNISSE })
    ]);
    const aufgabenHeute = alleAufgaben.filter(aufgabe => {
      const wann = zeitZahl(aufgabe.faellig);
      return wann >= tag.start && wann <= tag.end;
    });
    const aufgabenUeberfaellig = alleAufgaben.filter(aufgabe =>
      !aufgabe.erledigt && !!aufgabe.faellig && zeitZahl(aufgabe.faellig) < tag.start);
    return {
      version: 1 as const,
      tag: tag.id,
      erzeugtAm: jetztIso(),
      bereichIds: optionBereiche(optionen),
      aufgabenHeute,
      aufgabenUeberfaellig,
      termine: heutigeTermine,
      zuletzt: letzte,
      projekte: laufendeProjekte,
      pdfs: letztePdfs,
      lernkarten: {
        fehler: karten.filter(karte => karte.fehler),
        faellig: karten.filter(karte => karte.faellig && !karte.fehler),
        neu: karten.filter(karte => karte.neu)
      }
    };
  };

  const VERTRAG = Object.freeze({
    version: 2,
    speicher: 'store-meta',
    metaKey: LERN_STORE_KEY,
    speicherVersion: LERN_STORE_VERSION,
    entitaet: 'actor-card-referenz',
    referenzen: Object.freeze(['actorId', 'cardId']),
    inhaltUnveraendert: true,
    schreibrecht: 'lesen',
    kompatibilitaetsfeld: 'card.meta.' + LERN_KEY,
    algorithmus: 'sm2',
    legacy: ['sr', 'reviewVerlauf', 'lernAlgorithmus'],
    quellen: Object.freeze(['extern', 'eingebettet', 'legacy', 'leer']),
    migration: 'nur-ausdruecklich'
  });

  return {
    auflisten,
    anlegen,
    zuordnen,
    entfernen,
    bereicheVon,
    direkteBereichIds,
    heute,
    aufgaben,
    termine,
    zuletzt,
    projekte,
    pdfs,
    lernkarten,
    lernzustand: {
      VERTRAG,
      aktuellerAktor,
      lesen: lernzustandLesen,
      schreiben: lernzustandSchreiben
    },
    grenzen: Object.freeze({
      bereiche: MAX_BEREICHE,
      zuordnungenJeObjekt: MAX_ZUORDNUNGEN,
      ergebnisse: MAX_ERGEBNISSE,
      lernzustaendeJeKarte: MAX_AKTOREN,
      lernzustaendeGesamt: MAX_LERNZUSTAENDE,
      reviewsJeZustand: MAX_REVIEWS
    })
  };
})();

(window as any).Lebensbereiche = Lebensbereiche;
