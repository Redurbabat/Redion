/* ============================================================================
 * entwicklung/ui-reserve/reserve.ts — die Galerie der UI-Reserve
 * ----------------------------------------------------------------------------
 * ERZEUGT DARAUS WIRD `quell/entwicklung/ui-reserve/reserve.js`.
 * Die Quelle ist DIESE Datei; `npm run bauen:ts` schreibt das .js (§54).
 * ----------------------------------------------------------------------------
 * WAS DAS IST. Eine Entwicklerseite, die NICHT zur App gehört: sie steht
 * weder in `index.html` noch im GRUNDSTOCK noch in einem Register. Sie
 * zeigt die Uiverse-Originale, die für Redion geprüft wurden — samt der
 * Entscheidung, was aus jedem geworden ist.
 *
 * WARUM DIE ORIGINALE IN EINEM IFRAME LAUFEN. Sie tragen Klassen wie
 * `.button`, `.container`, `.loader` und `.spinner` — global und
 * ungekapselt. Im selben Dokument wie die Galerie kämen sie einander in
 * die Quere; jedes Original für sich in einem Rahmen bleibt unverändert
 * (das ist der Sinn eines Archivs) und stört nichts.
 *
 * WARUM KEIN ORIGINAL ERFUNDEN WIRD. 30 der 50 Einträge liegen ohne Code
 * vor. Sie bekommen eine Karte mit dem Satz „Originalcode noch nicht
 * verifiziert" — keine Rekonstruktion, keine ähnliche Komponente desselben
 * Autors. Ein Archiv, das rät, ist keins (Auftrag §0.10, §55.2).
 * ==========================================================================*/

type ReserveStatus = 'produktiv' | 'produktiv-adaptiert' | 'bedingt-produktiv' | 'reserve' | 'ersetzt';
type ReserveKategorie = 'loader' | 'button' | 'toggle' | 'navigation' | 'ki' | 'sonstiges';
type QuelleStatus = 'chat-original' | 'chat-original-snippet' | 'uiverse-galaxy-verifiziert'
  | 'uiverse-galaxy-verifiziert-struktur' | 'uiverse-seite-verifiziert' | 'nur-identifiziert' | 'nicht-verifiziert';

interface ReserveEintrag {
  id: string;
  nr: number;
  name: string;
  autor: string;
  quelle: string;
  quelleStatus: QuelleStatus;
  status: ReserveStatus;
  kategorie: ReserveKategorie;
  redionOrt: string;
  /** Pfad zur unveränderten Originaldatei — oder null, wenn es keine gibt. */
  original: string | null;
  notiz: string;
}

/* Nur diese Stufen dürfen ein Original ZEIGEN. „nur-identifiziert" und
   „nicht-verifiziert" haben keins — und dürften auch keins zeigen, wenn
   eines dastünde (Auftrag §7: „darf nicht behaupten, ihr Code sei das
   Original"). */
const ZEIGBAR: ReadonlySet<QuelleStatus> = new Set<QuelleStatus>([
  'chat-original', 'chat-original-snippet', 'uiverse-galaxy-verifiziert',
  'uiverse-galaxy-verifiziert-struktur', 'uiverse-seite-verifiziert'
]);

const STATUS_WORT: Record<ReserveStatus, string> = {
  'produktiv': 'produktiv', 'produktiv-adaptiert': 'produktiv, angepasst',
  'bedingt-produktiv': 'bedingt produktiv', 'reserve': 'Reserve', 'ersetzt': 'ersetzt'
};

const raster = document.getElementById('res-raster');
const statusZeile = document.getElementById('res-status');
const filterKnoepfe = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-filter]'));
let eintraege: ReserveEintrag[] = [];
let filter = 'alle';

const passt = (e: ReserveEintrag): boolean => {
  if (filter === 'alle') return true;
  if (filter === 'produktiv') return e.status === 'produktiv' || e.status === 'produktiv-adaptiert';
  if (filter === 'reserve') return e.status === 'reserve' || e.status === 'ersetzt';
  return e.kategorie === filter;
};

const zeile = (klasse: string, text: string): HTMLParagraphElement => {
  const p = document.createElement('p');
  p.className = klasse;
  p.textContent = text;
  return p;
};

const karte = (e: ReserveEintrag): HTMLElement => {
  const k = document.createElement('article');
  k.className = 'res-karte';
  k.dataset['status'] = e.status;
  const meta = document.createElement('div');
  meta.className = 'res-meta';
  const h = document.createElement('h2');
  h.textContent = `${String(e.nr).padStart(2, '0')} · ${e.name}`;
  meta.append(h,
    zeile('res-autor', `Autor: ${e.autor || 'unbekannt'}`),
    zeile('res-stand', `Redion: ${STATUS_WORT[e.status]}`),
    zeile('res-ort', e.redionOrt === '—' ? 'Kein produktiver Ort' : `Ort: ${e.redionOrt}`),
    zeile('res-quelle', `Quelle: ${e.quelleStatus}`),
    zeile('res-notiz', e.notiz));
  const vorschau = document.createElement('div');
  vorschau.className = 'res-vorschau';
  if (e.original && ZEIGBAR.has(e.quelleStatus)) {
    const rahmen = document.createElement('iframe');
    rahmen.loading = 'lazy';
    rahmen.title = `Originalvorschau: ${e.name}`;
    /* Ohne `allow-scripts`: die Originale brauchen kein JavaScript, und
       ein Archiv, das keins ausführt, kann auch keins mitbringen. */
    rahmen.setAttribute('sandbox', '');
    rahmen.src = e.original;
    vorschau.append(rahmen);
  } else {
    const fehlt = document.createElement('p');
    fehlt.className = 'res-fehlt';
    fehlt.setAttribute('role', 'note');
    fehlt.textContent = 'Originalcode noch nicht verifiziert';
    vorschau.append(fehlt);
  }
  k.append(meta, vorschau);
  return k;
};

const zeichnen = (): void => {
  if (!raster || !statusZeile) return;
  const sichtbar = eintraege.filter(passt);
  raster.replaceChildren(...sichtbar.map(karte));
  statusZeile.textContent = `${sichtbar.length} von ${eintraege.length} Komponenten`;
};

filterKnoepfe.forEach(b => b.addEventListener('click', () => {
  filter = b.dataset['filter'] ?? 'alle';
  filterKnoepfe.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  zeichnen();
}));

fetch('./katalog.json')
  .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
  .then((d: unknown) => { eintraege = Array.isArray(d) ? d as ReserveEintrag[] : []; zeichnen(); })
  .catch((fehler: unknown) => {
    if (statusZeile) statusZeile.textContent =
      'Der Katalog liess sich nicht laden: ' + (fehler instanceof Error ? fehler.message : String(fehler))
      + ' — diese Seite braucht einen kleinen Server (z. B. npm run server), von file:// blockiert der Browser fetch.';
  });
