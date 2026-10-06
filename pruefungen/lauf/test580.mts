/* ============================================================================
 * test580 — Eine ruhigere Oberfläche, und nichts ist weg (E701)
 * ----------------------------------------------------------------------------
 * Redur, 27. September 2026, ca. 16:45 UTC: „du muss mehr im redion arbeiten
 * du kannst auch die oberfläche bischen ruhige machen ohne etwas lösche also
 * eine funktionen …". Und ca. 21:45 UTC, im Fragebogen, zu den farbigen
 * Emoji in Menüs, Einstellungen und „Mehr": „Gezeichnete Zeichen
 * (Empfohlen)" — „Durch Redions eigene Linien-Symbole ersetzen, wie in der
 * Zeichenleiste. Alles bleibt am selben Ort."
 *
 * RUHIGER HEISST HIER: weniger, das gleichzeitig ruft — nicht weniger, das
 * da ist. Jede Zusage unten hat deshalb zwei Hälften: was LEISER wurde, und
 * dass der Griff dahinter noch am selben Ort mit demselben Auslöser steht
 * (§43, E218/E219 als Vorbild).
 *
 * WAS DIESER LAUF HÄLT
 *   §1  Eine Haupthandlung je Bild (grund.css: „HAUPTHANDLUNG. Genau eine je
 *       Bild"). Auf „Heute" ist „Lernen starten" die eine (E638); „Dokumente
 *       öffnen" steht daneben als Umrissknopf; „PDF öffnen" im Kopf ist in
 *       Ruhe eine getönte Pille und wird erst unter Zeiger und Tastenfokus
 *       voll violett mit Schein; der Themenknopf (seit E727 das Gestirn) ist
 *       in Ruhe neutral statt eines zweiten violetten Flecks. Das Zeichen
 *       der getönten Pille (seit E728 ohne Wort) liest sich mit 4,5 : 1 oder
 *       mehr — streng wie für Schrift, obwohl für ein Zeichen 3 : 1
 *       genügten.
 *   §2  „Zuletzt geöffnet" ruht: der Kartenring dreht nur, solange man
 *       hinzeigt oder der Fokus darin steht — im Leerlauf, am Telefon und
 *       hinter einem offenen Fenster läuft KEINE endlose Bewegung. Die
 *       Animation ist nicht gelöscht, nur angehalten; die Karten liegen in
 *       Ruhe flach.
 *   §3  Gezeichnete Zeichen: Einstellungen (Navigation), das ⋯-Menü der
 *       Seite, „Mehr", das R-Blatt, die Seitenwerkzeuge und „Termine" tragen
 *       Zeichen aus `Register.symbole` statt Emoji — jede Zeile mit GENAU
 *       einem gezeichneten Zeichen, ohne getipptes Zeichen daneben. Jeder
 *       Griff steht noch da: dieselben Kennungen (`data-b`, `data-a`,
 *       `data-r`) mit denselben Wörtern, in derselben Reihenfolge. Die
 *       Zeichen sind still (grau); nur der gewählte Bereich trägt den
 *       Akzent, Löschen bleibt rot, „Beta" ist ein grauer Zettel.
 *   §4  Aus ist grau: der Verlaufsschalter im Menü leuchtet nur, wenn er an
 *       ist; beim Überfahren kommt der Schimmer zurück.
 *   §5  Die Kennzahlkarten im Lernzentrum ruhen: Herz, Ring und Streifen
 *       sind grau, bis man die Karte anfasst. Die Zahlen bleiben.
 *   §6  Die Ecke des Menübands trägt den Grund des Bandes — kein schwarzer
 *       Block am Ende eines hellen Bandes.
 *   §7  Ein Titel am Telefon: die kleine Krume blendet aus, solange der
 *       grosse Titel zu sehen ist, und kehrt zurück, wenn er wegrollt. Sie
 *       bleibt im Baum; am Rechner ändert sich nichts. Zeichnet die
 *       Kopfzeile neu (Stern, Schloss), blitzt sie nicht auf — diese Probe
 *       kam mit E701 dazu, nach dem roten Commit.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   Gegen den Stand 515451f9 (vor E701) ist sie rot, in jedem Abschnitt —
 *   das steht im Commit „test580 (rot)". Die Gegenproben zu E701 stehen im
 *   Commit dazu.
 *
 *   node pruefungen/alle.mts 580
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page, BrowserContext } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
};
const server = http.createServer((a, b) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const datei = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(datei)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(datei));
});
/* Ein freier Port vom System (test400 empfiehlt das) — kein fester, der mit
   einem parallelen Lauf zusammenstossen könnte. */
await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
const PORT = (server.address() as { port: number }).port;

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const fehler: string[] = [];
const warte = (s: Page, ms: number) => s.waitForTimeout(ms);

/** Die App öffnen: Rechner 1440 × 900 oder Telefon 390 × 844 (Tastgerät). */
const oeffnen = async (handy: boolean, thema: 'light' | 'dark',
                       weniger = false): Promise<{ ctx: BrowserContext; s: Page }> => {
  const ctx = await browser.newContext({
    viewport: handy ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    ...(handy ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
    reducedMotion: weniger ? 'reduce' : 'no-preference'
  });
  const s = await ctx.newPage();
  s.on('pageerror', e => fehler.push(e.message));
  await s.goto(`http://127.0.0.1:${PORT}/index.html`);
  await s.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
    (document.getElementById('tree')?.children.length || 0) > 0, null, { timeout: 30000 });
  /* DAS THEMA ÜBER DIE APP, NICHT ÜBER DAS ATTRIBUT — `Aussehen` setzt ein
     von Hand gesetztes `data-theme` zurück (test576 hat das gefunden). */
  await s.evaluate((t: string) => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
      .forEach(el => el.remove());
    App.theme(t);
  }, thema);
  await s.mouse.move(2, 2);
  return { ctx, s };
};

/** Alles Schwebende weg, damit die nächste Ansicht frei steht. */
const aufraeumen = (s: Page) => s.evaluate(() =>
  document.querySelectorAll('.overlay, .menu, .menu-grund, #r-blatt').forEach(x => x.remove()));

/* ==========================================================================
 * Messwerkzeuge, die IN der Seite laufen. Als Zeichenkette, damit sie in
 * jedem `evaluate` dieselben sind.
 * ========================================================================*/
const WERKZEUG = `
  window.__rgb = (s) => { const m = String(s).match(/rgba?\\(([^)]+)\\)/); if (!m) return null;
    const q = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: q[0], g: q[1], b: q[2], a: q[3] ?? 1 }; };
  window.__hsl = (c) => { let { r, g, b } = c; r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)); let h = 0;
    if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
    return { h, s, l }; };
  window.__akzentHsl = () => { const i = document.createElement('i'); i.style.color = 'var(--accent)';
    document.body.appendChild(i); const c = window.__hsl(window.__rgb(getComputedStyle(i).color)); i.remove(); return c; };
  /* „Akzentgefüllt": deckend, gesättigt, im Farbton des Akzents. */
  window.__akzentig = (c, akz) => { if (!c || c.a < 0.6) return false; const x = window.__hsl(c);
    const dh = Math.min(Math.abs(x.h - akz.h), 360 - Math.abs(x.h - akz.h));
    return x.s > 0.35 && x.l > 0.2 && x.l < 0.8 && dh < 30; };
  window.__sichtbar = (el) => { const r = el.getBoundingClientRect(); if (r.width < 6 || r.height < 6) return false;
    if (r.bottom < 0 || r.right < 0 || r.top > innerHeight || r.left > innerWidth) return false;
    const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05; };
  /* Die LAUTEN Flächen eines Bildes: Knöpfe, die mit dem Akzent gefüllt
     sind (Farbe oder Verlauf aus Akzenttönen), dazu die Themenkugel und der
     dunkle Funkelknopf — alles, was „hier drücken" ruft. */
  window.__laut = () => { const akz = window.__akzentHsl(); const raus = [];
    for (const el of document.querySelectorAll('button, a, [role=button], .studio-gestirn')) {
      if (!window.__sichtbar(el) || el.closest('[inert]')) continue;
      const r = el.getBoundingClientRect(); if (r.width * r.height < 250) continue;
      const cs = getComputedStyle(el); const bg = window.__rgb(cs.backgroundColor);
      const stopps = [...(cs.backgroundImage || '').matchAll(/rgba?\\([^)]+\\)/g)].map(m => window.__rgb(m[0]));
      const verlauf = (cs.backgroundImage || '').includes('gradient') && stopps.length > 0 &&
        stopps.filter(c => window.__akzentig(c, akz)).length >= Math.ceil(stopps.length / 2);
      if (window.__akzentig(bg, akz) || verlauf || el.classList.contains('ru-funkel'))
        raus.push(((el.id ? '#' + el.id : el.tagName.toLowerCase()) + ' ' +
          (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\\s+/g, ' ')).slice(0, 40));
    }
    return raus; };
  window.__endlos = () => document.getAnimations().filter(a => { const t = a.effect && a.effect.getTiming ? a.effect.getTiming() : null;
    return a.playState === 'running' && t && t.iterations === Infinity; }).map(a => a.animationName || '?');
  /* Kontrast nach WCAG, mit dem Grund darunter zusammengesetzt. */
  window.__lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  window.__ueber = (oben, unten) => ({ r: oben.r * oben.a + unten.r * (1 - oben.a), g: oben.g * oben.a + unten.g * (1 - oben.a),
    b: oben.b * oben.a + unten.b * (1 - oben.a), a: 1 });
  window.__kontrast = (a, b) => { const x = window.__lum(a), y = window.__lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  /* Ein Zeichen in einer Zeile: genau EIN gezeichnetes <svg class="sym"> mit
     Strichen darin, und kein getipptes Zeichen daneben. */
  window.__zeichen = (zelle) => { if (!zelle) return 'keine Zelle';
    const svgs = zelle.querySelectorAll('svg.sym'); const text = (zelle.textContent || '').trim();
    if (svgs.length !== 1) return svgs.length + ' Zeichen' + (text ? ' + „' + text + '"' : '');
    if (!svgs[0].querySelector('path, rect, circle, ellipse, line, polyline, polygon')) return 'leeres svg';
    if (text) return 'getippt: „' + text + '"';
    return ''; };
  window.__emoji = /[\\u{1F300}-\\u{1FAFF}\\u{2600}-\\u{27BF}\\u{2B00}-\\u{2BFF}\\u{FE0F}\\u{1F000}-\\u{1F2FF}]/u;
  window.__still = (el) => { const c = window.__rgb(getComputedStyle(el).color); return c ? window.__hsl(c).s < 0.25 : false; };
`;
const werkzeug = (s: Page) => s.evaluate(WERKZEUG);

/** Das Wort einer Zeile, ohne Zeichen, Kürzel, Unterzeile und Schalter. */
const WORT = `(b, zelle) => { const k = b.cloneNode(true);
  k.querySelectorAll(zelle + ', .ms, .kenn, .sub, .mschalter, .snip, .pth, .rm-h').forEach(x => x.remove());
  return k.textContent.trim().replace(/\\s+/g, ' '); }`;

/* Was vor E701 da war — abgelesen am Stand 515451f9, Rechner und Telefon.
   Wer hier einen Eintrag streicht, hat einen Griff gelöscht (§43). */
const EINST = ['konto=Mein Konto', 'allgemein=Einstellungen', 'benachricht=Benachrichtigungen',
  'daten=Importieren', 'ki=Künstliche Intelligenz', 'verbindungen=Verbindungen', 'mcp=MCP',
  'worker=Worker', 'verifiziert=Verifizierte Seiten', 'oeffentlich=Öffentliche Seiten', 'emoji=Emoji',
  'arbeitsplatz=Arbeitsbereich', 'analysen=Analysen', 'bereiche=Bereiche', 'sicherheit=Sicherheit',
  'schluessel=Schlüssel und APIs', 'speicher=Speicher', 'abrechnung=Abrechnung', 'ueber=Über diese App'];
const MENUE = ['link=Link kopieren', 'inhalt=Seiteninhalte kopieren', 'dup=Duplizieren',
  'wz-verschieben=Verschieben nach', 'archiv=Archivieren', 'del=In den Papierkorb verschieben',
  'wz-praesi=Präsentieren', 'klein=Kleiner Text', 'breit=Volle Breite', 'pfad=Pfadnavigation anzeigen',
  'anpassen=Seite anpassen', 'offline=Offline verfügbar', 'wz-gesperrt=Seite sperren',
  'mitki=Mit KI verwenden', 'teilen=Teilen und ausgeben', 'verlauf=Versionsverlauf',
  'kopf-komm=Kommentare', 'auto=Automationen', 'fav=Zu Favoriten', 'produkt-bereiche=Lebensbereiche',
  'rename=Umbenennen', 'icon=Symbol ändern', 'cover=Cover ändern', 'pid=Seiten-ID kopieren',
  'komm=Kommentare', 'vorschlag=Änderungen vorschlagen', 'uebersetzen=Übersetzen',
  'undo=Rückgängig machen', 'export=Als Markdown', 'import=Markdown einlesen',
  'wz-vorlage=Als Vorlage speichern', 'wz-vorlage-ein=Aus Vorlage einfügen',
  'wz-versionen=Versionsverlauf', 'wz-wiki=In Wiki umwandeln', 'wz-teilen=Teilen und ausgeben',
  'wz-erinnerung=Erinnerung', 'wz-sperren=Verschlüsseln', 'wz-fokus=Fokus-Modus',
  'wz-quelltext=Markdown-Quelltext', 'wz-statistik=Statistik', 'wz-html=Als HTML',
  'wz-drucken=Drucken / PDF', 'stat2=Seitenaufrufe', 'updates=Updates und Analysen',
  'benach=Benachrichtigungen', 'verbind=Verbindungen', 'papier=Gelöschte Seiten'];
const MEHR = ['workspace=Seiten & Wissen', 'schublade=Arbeitsbereich', 'kompass=Kompass',
  'befehle=Befehle', 'tasten=Tastenkürzel', 'vorlagen=Vorlagen', 'sichern=Sicherung',
  'import=Importieren', 'inbox=Posteingang', 'wolke=Wolke', 'papierkorb=Papierkorb',
  'einstellungen=Einstellungen', 'ueber=Über Redion'];
const RBLATT = ['suche=Suchen', 'befehle=Befehle', 'start=Start', 'seiten=Seiten', 'mehr=Mehr',
  'neu=Neue Seite', 'ki=KI und Verlauf', 'import=Importieren', 'sichern=Sichern',
  'papierkorb=Papierkorb', 'tasten=Tastenkürzel', 'einstellungen=Einstellungen'];
const WERKZEUGE = ['cover=Cover', 'wide=Volle Breite', 'font=Schrift', 'vorlage=Vorlage', 'ai=Mit KI'];

/* Aufbauten, die in der Seite laufen. */
const HEUTE = async () => {
  const fach = Store.addPage(null, { text: 'Elektrotechnik' });
  for (const q of ['Ohmsches Gesetz :: U = R · I', 'Leistung :: P = U · I', 'Arbeit :: W = P · t'])
    Store.addBlock(fach.id, 'flashcard', { text: q });
  Produktwelten.lernen('heute');
  await new Promise(r => setTimeout(r, 1100));
};
const REGAL = async () => {
  const namen = ['Elektrotechnik Skript', 'Wochenplan KW 35', 'Baustelle Halle 3', 'Rezepte', 'Prüfungsvorbereitung'];
  namen.forEach((name, i) => {
    const s = Store.addPage(null, { text: name });
    Store.addBlock(s.id, 'text', { text: 'Ein Satz auf ' + name + '.' });
    if (i < 3) Store.updateBlock(s.id, { zuletztGeoeffnet: new Date(Date.now() - i * 3600000).toISOString() });
  });
  await Store.flush();
  Produktwelten.bibliothek();
  await new Promise(r => setTimeout(r, 1300));
};
const SEITE = async () => {
  const s = Store.addPage(null, { text: 'Wärmepumpe — Notizen', icon: '🔥' });
  for (let i = 0; i < 30; i++) Store.addBlock(s.id, 'text', { text: 'Messreihe ' + (i + 1) + ': Vorlauf, Rücklauf und Spreizung notiert.' });
  await Store.flush();
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 900));
};

/* ══ §1 Eine Haupthandlung je Bild ═══════════════════════════════════════ */
console.log('\n§1 Eine Haupthandlung je Bild — „Heute" am Rechner');
for (const thema of ['light', 'dark'] as const) {
  const { ctx, s } = await oeffnen(false, thema);
  await werkzeug(s);
  await s.evaluate(HEUTE);
  await s.mouse.move(2, 2); await warte(s, 400);
  const m = await s.evaluate(() => {
    const w = window as any;
    const dok = document.querySelector<HTMLElement>('.lw-desk .lw-actions [data-lw-action="library"], .lw-desk .lw-actions [data-lw-open]');
    const lern = document.querySelector<HTMLElement>('.lw-next-step .lw-actions [data-lw-train], .lw-next-step .lw-actions [data-lw-nav="lernen"]');
    const kopf = document.getElementById('studio-import');
    const kcs = kopf ? getComputedStyle(kopf) : null;
    const leiste = document.getElementById('studio-bar');
    const grund = w.__rgb(getComputedStyle(leiste || document.body).backgroundColor);
    const pille = kcs ? w.__ueber(w.__rgb(kcs.backgroundColor), grund) : null;
    /* Das Gestirn (E727): das gerade sichtbare Zeichen, in Ruhe. */
    const gestirn = document.querySelector('#studio-theme');
    const zeichen = gestirn ? [...gestirn.querySelectorAll('[data-sym]')].find(e => +getComputedStyle(e).opacity > 0.5) : null;
    return {
      laut: w.__laut() as string[],
      dok: dok ? { da: w.__sichtbar(dok), primaer: dok.classList.contains('is-primary'),
                   rand: getComputedStyle(dok).borderTopStyle !== 'none' && parseFloat(getComputedStyle(dok).borderTopWidth) > 0,
                   hoch: Math.round(dok.getBoundingClientRect().height),
                   gefuellt: w.__akzentig(w.__rgb(getComputedStyle(dok).backgroundColor), w.__akzentHsl()) ||
                     getComputedStyle(dok).backgroundImage.includes('gradient') } : null,
      lern: lern ? { da: w.__sichtbar(lern), text: (lern.textContent || '').trim() } : null,
      kopf: kcs ? { verlauf: kcs.backgroundImage.includes('gradient'), schein: kcs.boxShadow !== 'none',
                    kontrast: pille ? +w.__kontrast(w.__rgb(kcs.color), pille).toFixed(2) : 0 } : null,
      gestirnNeutral: zeichen && gestirn ? w.__hsl(w.__rgb(getComputedStyle(zeichen).color)).s < 0.25 &&
        !w.__akzentig(w.__rgb(getComputedStyle(gestirn).backgroundColor), w.__akzentHsl()) : null
    };
  });
  const t = thema === 'light' ? 'hell' : 'dunkel';
  p(`${t}: genau EINE laute Fläche im Bild — und sie ist „Lernen starten"`,
    m.laut.length === 1 && /Lernen/.test(m.laut[0] ?? ''), m.laut.join(' · '));
  p(`${t}: „Lernen starten" steht da`, !!m.lern?.da, JSON.stringify(m.lern));
  p(`${t}: „Dokumente öffnen" steht noch da, derselbe Griff, 44 px hoch`,
    !!m.dok?.da && (m.dok?.hoch ?? 0) >= 44, JSON.stringify(m.dok));
  p(`${t}: … als Umrissknopf — nicht gefüllt, mit Rand, nicht „is-primary"`,
    !!m.dok && !m.dok.gefuellt && m.dok.rand && !m.dok.primaer, JSON.stringify(m.dok));
  p(`${t}: „PDF öffnen" im Kopf ist in Ruhe getönt — kein Verlauf, kein Schein`,
    !!m.kopf && !m.kopf.verlauf && !m.kopf.schein, JSON.stringify(m.kopf));
  p(`${t}: … und sein Zeichen liest sich (≥ 4,5 : 1)`, (m.kopf?.kontrast ?? 0) >= 4.5, String(m.kopf?.kontrast));
  /* Bis E727: „hell: der Themenknopf ist ein grauer Mond". Das Gestirn hat
     keinen Mond aus Farbe mehr — gefragt wird dasselbe in BEIDEN Themen:
     in Ruhe ein graues Zeichen, keine Akzentfläche. */
  p(`${t}: der Themenknopf ist in Ruhe neutral — kein zweiter violetter Fleck`, m.gestirnNeutral === true, String(m.gestirnNeutral));

  /* Unter dem Zeiger und unter dem Tastenfokus wird der Kopfknopf der volle
     Hauptknopf — die Farbe ist Zustand, nicht Dauerschmuck. */
  await s.hover('#studio-import'); await warte(s, 350);
  const hover = await s.evaluate(() => { const cs = getComputedStyle(document.getElementById('studio-import')!);
    return { verlauf: cs.backgroundImage.includes('gradient'), schein: cs.boxShadow !== 'none' }; });
  p(`${t}: unter dem Zeiger voll: Verlauf und Schein`, hover.verlauf && hover.schein, JSON.stringify(hover));
  await s.mouse.move(2, 2);
  await s.focus('#studio-theme'); await s.keyboard.press('Tab'); await warte(s, 350);
  const fokus = await s.evaluate(() => { const k = document.getElementById('studio-import')!; const cs = getComputedStyle(k);
    return { hier: document.activeElement === k, sichtbar: k.matches(':focus-visible'),
             verlauf: cs.backgroundImage.includes('gradient'), schein: cs.boxShadow !== 'none' }; });
  p(`${t}: unter dem Tastenfokus ebenso`, fokus.hier && fokus.verlauf && fokus.schein, JSON.stringify(fokus));
  await ctx.close();
}

/* ══ §2 „Zuletzt geöffnet" ruht ══════════════════════════════════════════ */
console.log('\n§2 „Zuletzt geöffnet" ruht — nichts dreht sich im Leerlauf');
{
  const { ctx, s } = await oeffnen(false, 'light');
  await werkzeug(s);
  await s.evaluate(REGAL);
  await s.mouse.move(2, 2); await warte(s, 400);
  const ruhe = await s.evaluate(() => ({
    endlos: (window as any).__endlos() as string[],
    ring: !!document.querySelector('.rmo-recent .rmo-ring-trommel'),
    name: getComputedStyle(document.querySelector('.rmo-recent .rmo-ring-trommel') || document.body).animationName,
    karten: [...document.querySelectorAll<HTMLElement>('.rmo-recent-card')].map(k => getComputedStyle(k).transform)
  }));
  p('Der Ring steht im Regal', ruhe.ring);
  gleich('In Ruhe läuft keine endlose Bewegung', ruhe.endlos, []);
  p('… die Drehung ist nicht gelöscht, nur angehalten (dieselbe Animation)',
    ruhe.name === 'rmo-ring-drehen', ruhe.name);
  p('… und die zuletzt geöffneten Karten liegen flach',
    ruhe.karten.length === 3 && ruhe.karten.every(t => t === 'none'), ruhe.karten.join(' | '));

  await s.hover('.rmo-recent h2'); await warte(s, 400);
  const zeigt = await s.evaluate(() => (window as any).__endlos() as string[]);
  p('Zeigt man darauf, dreht der Ring', zeigt.includes('rmo-ring-drehen'), zeigt.join(','));
  await s.mouse.move(2, 890); await warte(s, 400);
  gleich('Zeiger weg: wieder still', await s.evaluate(() => (window as any).__endlos()), []);
  await s.focus('.rmo-recent-card'); await warte(s, 300);
  const fokus = await s.evaluate(() => (window as any).__endlos() as string[]);
  p('Mit der Tastatur hinein: er dreht (der Fokus zählt wie der Zeiger)',
    fokus.includes('rmo-ring-drehen'), fokus.join(','));
  await s.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  /* Hinter einem offenen Fenster: auch wenn der Zeiger dort steht, wo der
     Ring ist. */
  await s.hover('.rmo-recent h2'); await warte(s, 200);
  await s.evaluate(() => Einstellungen.oeffne('allgemein')); await warte(s, 500);
  gleich('Hinter einem offenen Fenster dreht nichts', await s.evaluate(() => (window as any).__endlos()), []);
  await ctx.close();
}
{
  const { ctx, s } = await oeffnen(true, 'dark');
  await werkzeug(s);
  await s.evaluate(REGAL); await warte(s, 400);
  gleich('Am Telefon (kein Zeiger): im Leerlauf still',
    await s.evaluate(() => (window as any).__endlos()), []);
  await ctx.close();
}

/* ══ §3 Gezeichnete Zeichen, alle Griffe am selben Ort ═══════════════════ */
console.log('\n§3 Gezeichnete Zeichen — und jeder Griff steht noch da');
for (const handy of [false, true]) {
  const g = handy ? 'Telefon' : 'Rechner';
  const { ctx, s } = await oeffnen(handy, handy ? 'dark' : 'light');
  await werkzeug(s);

  /* — Einstellungen: die Navigation — */
  await s.evaluate(() => Einstellungen.oeffne('allgemein')); await warte(s, 600);
  const e = await s.evaluate(`(() => { const wort = ${WORT};
    const kn = [...document.querySelectorAll('.einst-nav button[data-b]')];
    return { griffe: kn.map(b => b.dataset.b + '=' + wort(b, '.mi')),
      falsch: kn.map(b => [b.dataset.b, window.__zeichen(b.querySelector('.mi'))]).filter(x => x[1]),
      emoji: kn.filter(b => window.__emoji.test(b.textContent)).map(b => b.dataset.b),
      laut: kn.filter(b => !b.classList.contains('on') && b.querySelector('svg.sym') &&
                           !window.__still(b.querySelector('svg.sym'))).map(b => b.dataset.b),
      aktuell: (() => { const b = document.querySelector('.einst-nav button.on svg.sym');
        return b ? window.__akzentig(window.__rgb(getComputedStyle(b).color), window.__akzentHsl()) ||
          window.__hsl(window.__rgb(getComputedStyle(b).color)).s > 0.3 : false; })() }; })()`) as any;
  gleich(`${g} · Einstellungen: dieselben 19 Bereiche, dieselben Wörter, dieselbe Folge`, e.griffe, EINST);
  p(`${g} · Einstellungen: jede Zeile trägt genau ein gezeichnetes Zeichen`, e.falsch.length === 0, JSON.stringify(e.falsch.slice(0, 5)));
  gleich(`${g} · Einstellungen: kein Emoji`, e.emoji, []);
  gleich(`${g} · Einstellungen: die Zeichen sind still (grau)`, e.laut, []);
  p(`${g} · Einstellungen: der gewählte Bereich trägt den Akzent`, e.aktuell === true);
  await aufraeumen(s);

  /* — die Seite, ihre Werkzeuge und ihr ⋯-Menü — */
  await s.evaluate(SEITE);
  if (handy) {
    const w = await s.evaluate(`(() => { const kn = [...document.querySelectorAll('.pg-tools button[data-a]')];
      const wort = (b) => { const k = b.cloneNode(true); k.querySelectorAll('svg').forEach(x => x.remove()); return k.textContent.trim().replace(/\\s+/g, ' '); };
      return { griffe: kn.map(b => b.dataset.a + '=' + wort(b)),
        ohne: kn.filter(b => b.querySelectorAll('svg.sym').length !== 1).map(b => b.dataset.a),
        emoji: kn.filter(b => window.__emoji.test(b.textContent)).map(b => b.dataset.a) }; })()`) as any;
    gleich('Telefon · Seitenwerkzeuge: dieselben fünf Griffe mit denselben Wörtern', w.griffe, WERKZEUGE);
    gleich('Telefon · Seitenwerkzeuge: je ein gezeichnetes Zeichen', w.ohne, []);
    gleich('Telefon · Seitenwerkzeuge: kein Emoji', w.emoji, []);
  }
  await s.evaluate(() => document.getElementById('btn-page-menu')?.click()); await warte(s, 600);
  const m = await s.evaluate(`(() => { const wort = ${WORT};
    const kn = [...document.querySelectorAll('.menu button[data-a]')];
    const kenn = document.querySelector('.menu .kenn');
    return { griffe: kn.map(b => b.dataset.a + '=' + wort(b, '.mi')),
      falsch: kn.map(b => [b.dataset.a, window.__zeichen(b.querySelector('.mi'))]).filter(x => x[1]),
      emoji: kn.filter(b => window.__emoji.test(b.textContent)).map(b => b.dataset.a),
      laut: kn.filter(b => !b.classList.contains('rot') && b.querySelector('svg.sym') &&
                           !window.__still(b.querySelector('svg.sym'))).map(b => b.dataset.a),
      rot: (() => { const d = document.querySelector('.menu.blatt [data-a="del"] svg.sym'); if (!d) return null;
        const c = window.__hsl(window.__rgb(getComputedStyle(d).color)); return c.s > 0.4 && (c.h < 20 || c.h > 340); })(),
      schrift: document.querySelectorAll('.menu button[data-schrift]').length,
      kenn: kenn ? { text: kenn.textContent.trim(), grau: window.__hsl(window.__rgb(getComputedStyle(kenn).backgroundColor)).s < 0.25 } : null }; })()`) as any;
  gleich(`${g} · ⋯-Menü: dieselben 47 Einträge, dieselben Wörter, dieselbe Folge`, m.griffe, MENUE);
  p(`${g} · ⋯-Menü: die drei Schriftkacheln stehen noch da`, m.schrift === 3, String(m.schrift));
  p(`${g} · ⋯-Menü: jede Zeile trägt genau ein gezeichnetes Zeichen`, m.falsch.length === 0, JSON.stringify(m.falsch.slice(0, 6)));
  gleich(`${g} · ⋯-Menü: kein Emoji`, m.emoji, []);
  gleich(`${g} · ⋯-Menü: die Zeichen sind still (grau)`, m.laut, []);
  if (handy) p('Telefon · ⋯-Menü: Löschen bleibt rot', m.rot === true, String(m.rot));
  p(`${g} · ⋯-Menü: „Beta" steht noch da — als grauer Zettel`,
    m.kenn?.text === 'Beta' && m.kenn?.grau === true, JSON.stringify(m.kenn));
  await aufraeumen(s);

  /* — Mehr — */
  await s.evaluate(() => { Ansichten.mehr(); }); await warte(s, 600);
  const h = await s.evaluate(`(() => { const wort = ${WORT};
    const kn = [...document.querySelectorAll('.home-liste button[data-a]')];
    return { griffe: kn.map(b => b.dataset.a + '=' + wort(b, '.mz')),
      falsch: kn.map(b => [b.dataset.a, window.__zeichen(b.querySelector('.mz'))]).filter(x => x[1]),
      laut: kn.filter(b => b.querySelector('svg.sym') && !window.__still(b.querySelector('svg.sym'))).map(b => b.dataset.a) }; })()`) as any;
  gleich(`${g} · Mehr: dieselben 13 Wege mit denselben Wörtern`, h.griffe, MEHR);
  p(`${g} · Mehr: jede Zeile trägt genau ein gezeichnetes Zeichen`, h.falsch.length === 0, JSON.stringify(h.falsch.slice(0, 6)));
  gleich(`${g} · Mehr: die Zeichen sind still (grau)`, h.laut, []);

  /* — Termine — */
  await s.evaluate(() => { Ansichten.termine(); }); await warte(s, 600);
  const t = await s.evaluate(`(() => { const karten = [...document.querySelectorAll('#page .home-karten .hk')];
    const zeilen = [...document.querySelectorAll('#page .home-liste button[data-open] > span:first-child')];
    return { karten: karten.map(k => k.dataset.a),
      kartenOhne: karten.filter(k => k.querySelectorAll('svg.sym').length !== 1).map(k => k.dataset.a),
      emoji: [...karten, ...zeilen].filter(k => window.__emoji.test(k.textContent)).length,
      zeilen: zeilen.length, zeilenOhne: zeilen.filter(z => !z.querySelector('svg.sym')).length }; })()`) as any;
  gleich(`${g} · Termine: dieselben drei Karten`, t.karten, ['kal-auf', 'kal', 'mtg']);
  gleich(`${g} · Termine: jede Karte mit genau einem gezeichneten Zeichen`, t.kartenOhne, []);
  p(`${g} · Termine: die Zeilen tragen ein Zeichen statt einer Stecknadel`,
    t.zeilen > 0 && t.zeilenOhne === 0 && t.emoji === 0, JSON.stringify(t));

  /* — das R-Blatt (nur am Telefon) — */
  if (handy) {
    await s.evaluate(() => App.arbeitsbereich()); await warte(s, 600);
    const r = await s.evaluate(`(() => { const wort = ${WORT};
      const kn = [...document.querySelectorAll('#r-blatt .rm-gruppe button[data-r]')];
      const zu = document.querySelector('#r-blatt .rm-zu');
      return { griffe: kn.map(b => b.dataset.r + '=' + wort(b, '.rm-z')),
        falsch: kn.map(b => [b.dataset.r, window.__zeichen(b.querySelector('.rm-z'))]).filter(x => x[1]),
        zu: zu ? { name: zu.getAttribute('aria-label'), zeichen: window.__zeichen(zu) } : null,
        laut: kn.filter(b => b.querySelector('svg.sym') && !window.__still(b.querySelector('svg.sym'))).map(b => b.dataset.r) }; })()`) as any;
    gleich('Telefon · R-Blatt: dieselben 12 Wege mit denselben Wörtern', r.griffe, RBLATT);
    p('Telefon · R-Blatt: jede Zeile trägt genau ein gezeichnetes Zeichen', r.falsch.length === 0, JSON.stringify(r.falsch.slice(0, 6)));
    p('Telefon · R-Blatt: Schliessen heisst weiter „Schliessen" und ist gezeichnet',
      r.zu?.name === 'Schliessen' && r.zu?.zeichen === '', JSON.stringify(r.zu));
    gleich('Telefon · R-Blatt: die Zeichen sind still (grau)', r.laut, []);
  }
  await ctx.close();
}

/* ══ §4 Aus ist grau ═════════════════════════════════════════════════════ */
console.log('\n§4 Aus ist grau — nur der Schalter, der an ist, leuchtet');
{
  const { ctx, s } = await oeffnen(false, 'light');
  await werkzeug(s);
  await s.evaluate(SEITE);
  await s.evaluate(() => document.getElementById('btn-page-menu')?.click()); await warte(s, 700);
  const lies = () => s.evaluate(() => {
    const v = (a: string) => { const el = document.querySelector<HTMLElement>(`.menu [data-a="${a}"] .mschalter > .rmo-verlauf`);
      if (!el) return null; const cs = getComputedStyle(el);
      return { deck: +(+cs.opacity).toFixed(2), filter: cs.filter }; };
    return { aus: v('klein'), an: v('pfad') };
  });
  const r = await lies();
  p('Der Verlaufsschalter ist gebaut (aus und an)', !!r.aus && !!r.an, JSON.stringify(r));
  p('AUS: der Verlauf ist grau und leise (Deckkraft ≤ 0,15, entsättigt)',
    !!r.aus && r.aus.deck <= 0.15 && /saturate\(0\)/.test(r.aus.filter), JSON.stringify(r.aus));
  p('AN: er leuchtet wie bisher (Deckkraft ≥ 0,6)', !!r.an && r.an.deck >= 0.6, JSON.stringify(r.an));
  await s.hover('.menu [data-a="klein"]'); await warte(s, 400);
  const ueber = await lies();
  p('Unter dem Zeiger kommt der Schimmer zurück (≥ 0,45)', !!ueber.aus && ueber.aus.deck >= 0.45, JSON.stringify(ueber.aus));
  await ctx.close();
}

/* ══ §5 Die Kennzahlkarten ruhen ═════════════════════════════════════════ */
console.log('\n§5 Die Kennzahlkarten im Lernzentrum ruhen');
{
  const { ctx, s } = await oeffnen(false, 'light');
  await werkzeug(s);
  await s.evaluate(async () => {
    const fach = Store.addPage(null, { text: 'Elektrotechnik' });
    for (const q of ['Ohmsches Gesetz :: U = R · I', 'Leistung :: P = U · I']) Store.addBlock(fach.id, 'flashcard', { text: q });
    Produktwelten.lernen('lernen');
    await new Promise(r => setTimeout(r, 1200));
  });
  await s.mouse.move(2, 2); await warte(s, 400);
  const lies = () => s.evaluate(() => [...document.querySelectorAll<HTMLElement>('.stat-karte.lw-metrik')].map(k => ({
    zahl: (k.querySelector('strong')?.textContent || '').trim(),
    teile: [':scope > .rmo-heart', ':scope > .rmo-ring', ':scope > .rmo-pfad'].map(sel => {
      const el = k.querySelector<HTMLElement>(sel); return el ? getComputedStyle(el).filter : 'fehlt'; })
  })));
  const ruhe = await lies();
  p('Es gibt Kennzahlkarten mit Herz, Ring und Streifen',
    ruhe.length >= 4 && ruhe.every(k => k.teile.every(f => f !== 'fehlt')), JSON.stringify(ruhe.slice(0, 2)));
  p('In Ruhe sind Herz, Ring und Streifen grau (entsättigt)',
    ruhe.every(k => k.teile.every(f => /saturate\(0\)/.test(f))), JSON.stringify(ruhe.map(k => k.teile)));
  p('Die Zahlen bleiben', ruhe.every(k => k.zahl.length > 0), JSON.stringify(ruhe.map(k => k.zahl)));
  await s.hover('.stat-karte.lw-metrik'); await warte(s, 400);
  const an = await lies();
  p('Angefasst: die Karte zeigt ihre Farbe wieder',
    !!an[0] && an[0].teile.every(f => !/saturate\(0\)/.test(f)), JSON.stringify(an[0]));
  await ctx.close();
}

/* ══ §6 Die Ecke des Bandes ══════════════════════════════════════════════ */
console.log('\n§6 Die Ecke des Menübands trägt den Grund des Bandes');
{
  const { ctx, s } = await oeffnen(false, 'light');
  await werkzeug(s);
  await s.evaluate(SEITE);
  await s.evaluate(() => document.getElementById('studio-tools')?.click()); await warte(s, 700);
  const b = await s.evaluate(() => {
    const w = window as any;
    const band = document.querySelector<HTMLElement>('#menueband');
    const ecke = document.querySelector<HTMLElement>('#menueband .mb-rechts');
    if (!band || !ecke || !w.__sichtbar(ecke)) return null;
    const l = (el: HTMLElement) => w.__lum(w.__rgb(getComputedStyle(el).backgroundColor));
    return { band: +l(band).toFixed(3), ecke: +l(ecke).toFixed(3) };
  });
  p('Das Band ist offen und die Ecke sichtbar', !!b, JSON.stringify(b));
  p('Die Ecke ist so hell wie das Band (Helligkeit ± 0,05)',
    !!b && Math.abs(b.band - b.ecke) <= 0.05, JSON.stringify(b));
  await ctx.close();
}

/* ══ §7 Ein Titel am Telefon ═════════════════════════════════════════════ */
console.log('\n§7 Ein Titel am Telefon — die Krume weicht dem grossen Titel');
{
  const { ctx, s } = await oeffnen(true, 'dark');
  await werkzeug(s);
  const krume = () => s.evaluate(() => {
    const a = document.querySelector<HTMLElement>('#crumb > a:last-child');
    return a ? { deck: +(+getComputedStyle(a).opacity).toFixed(2), text: (a.textContent || '').trim() } : null;
  });
  await s.evaluate(() => Ansichten.termine()); await warte(s, 700);
  const oben = await krume();
  p('Termine: die Krume steht im Baum', !!oben && oben.text === 'Termine', JSON.stringify(oben));
  p('Termine: solange „Termine" gross dasteht, ist die kleine Krume ausgeblendet',
    !!oben && oben.deck === 0, JSON.stringify(oben));
  await s.evaluate(() => { const r = document.getElementById('scroll'); if (r) r.scrollTop = 600; }); await warte(s, 600);
  const unten = await krume();
  p('Termine: rollt der Titel weg, kehrt die Krume zurück', !!unten && unten.deck === 1, JSON.stringify(unten));

  await s.evaluate(SEITE); await warte(s, 300);
  await s.evaluate(() => { const r = document.getElementById('scroll'); if (r) r.scrollTop = 0; }); await warte(s, 500);
  const seiteOben = await krume();
  p('Seite: am Anfang nur der grosse Titel', !!seiteOben && seiteOben.deck === 0, JSON.stringify(seiteOben));
  /* DERSELBE TITEL, DERSELBE BEOBACHTER. `pfad()` läuft auch nach Stern
     und Schloss und zeichnet die Krume neu; ein neuer Beobachter meldet
     sich erst einen Takt später, und so lange stand die Krume wieder da —
     sie blitzte auf. Zwölf Takte lang je eine Probe. */
  const blitz = await s.evaluate(() => new Promise<number>(fertig => {
    let hoechste = 0, takt = 0;
    (window as any).Kopfleiste.pfad();
    const probe = (): void => {
      const a = document.querySelector<HTMLElement>('#crumb > a:last-child');
      if (a) hoechste = Math.max(hoechste, +getComputedStyle(a).opacity);
      if (++takt < 12) requestAnimationFrame(probe); else fertig(+hoechste.toFixed(2));
    };
    requestAnimationFrame(probe);
  }));
  p('Seite: neu gezeichnet (Stern, Schloss) blitzt die Krume nicht auf',
    blitz <= 0.05, 'höchste Deckkraft ' + blitz);
  await s.evaluate(() => { const r = document.getElementById('scroll'); if (r) r.scrollTop = 900; }); await warte(s, 600);
  const seiteUnten = await krume();
  p('Seite: weggerollt, steht der Name wieder oben', !!seiteUnten && seiteUnten.deck === 1, JSON.stringify(seiteUnten));
  await ctx.close();
}
{
  const { ctx, s } = await oeffnen(false, 'dark');
  await werkzeug(s);
  await s.evaluate(() => Ansichten.termine()); await warte(s, 700);
  const a = await s.evaluate(() => { const el = document.querySelector<HTMLElement>('#crumb > a:last-child');
    return el ? +(+getComputedStyle(el).opacity).toFixed(2) : null; });
  gleich('Am Rechner bleibt die Krume, wie sie war', a, 1);
  await ctx.close();
}

p('Kein Seitenfehler während des Laufs', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();
console.log(`\n  Suite 580 — ruhigere Oberfläche: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
