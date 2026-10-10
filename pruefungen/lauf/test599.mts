/* Suite 599 — KI am Ort: „Werkzeuge & Kontext" löst sich auf (E724)
 * ============================================================================
 * Redur, PDF vom 29. September (OneNote S. 16), am Foto des KI-Fensters mit
 * dem roten Kreis um die Zeile „Werkzeuge & Kontext":
 *
 *   „hier beim ki sollte alles komplet was beim werkzeuge undkontext seteh
 *    dort integriert sein also im passenden ortern du muss entscheiden was
 *    wo kommt und warum ."
 *
 * Und der Masterprompt (S. 7, S. 9): „Keine Funktion verlieren. Wenn ein
 * Eintrag mehrfach sinnvoll ist, eine gemeinsame Datenquelle/Command-
 * Registry verwenden statt Kopien" — „Eine Quelle pro Funktion" — „Keine
 * Attrappen … jeder sichtbare … Schalter muss eine echte, getestete Aktion
 * haben".
 *
 * GEMESSEN, BEVOR GEBAUT WURDE (messungen §93): die Schublade hielt 19
 * Bedienelemente in einem 324 px hohen Kasten mit eigener Rolle (529 px
 * Inhalt); geöffnet schrumpfte der Chat von 617 auf 293 px (Telefon 471 →
 * 211), und 8 der 19 standen erst nach dem Rollen da. Dahinter fünf
 * Kataloge für Aufträge und zwei Läufer — „Zusammenfassen" schickte je nach
 * Weg drei verschiedene Anweisungen. Am Telefon lag jede Ebene, die das
 * KI-Blatt öffnet, UNTER ihm (Menü 600, Overlay 700, Hinweis 900 gegen 920),
 * und ein Tipp ins sichtbare Eingabefeld wählte unsichtbar „Gemma 2 · 2B".
 *
 * DIESER LAUF PRÜFT DIE ZUSAGEN ALS ZAHLEN UND WIRKUNGEN:
 *
 *   §1 KEIN SAMMELKASTEN. Es gibt kein `#ai-tools`. Jeder der 19 früheren
 *      Einträge ist von seinem EINEN neuen Ort aus in höchstens zwei
 *      Handgriffen erreichbar — geprüft an der Wirkung, geführt unter der
 *      alten Kennung.
 *   §2 DIE QUELLEN AM PROMPT. `#ai-quellen` steht in `.ai-compose
 *      .ai-leiste` gleich nach „+", misst 44 × 44, trägt `aria-label` (es
 *      nennt die aktiven Quellen) und `aria-expanded`; ein Druck öffnet die
 *      fünf `[data-qs]` mit `aria-pressed`, dazu „Nur aus meinen Quellen"
 *      und „Alle KI-Einstellungen". Ein Umschalter ändert `Kontext.quellen`
 *      UND das Schild des Knopfs.
 *   §3 DER LEERE CHAT. `.ai-start` „Für diese Seite" steht zwischen `#chat`
 *      und `.ai-foot`, sichtbar, solange niemand gefragt hat; nach der
 *      ersten Frage weg, nach „Neuer Chat" wieder da. `#ai-db`/`#ai-seite`
 *      behalten den Look aus E528 (rgb(16, 16, 16), 14 Buchstaben). Bei
 *      800 × 900 (Redurs Fenster) steht jeder Knopf ohne Rollen im Bild.
 *      Am Telefon (390 und 360) misst jede der acht Seitenaktionen 44 px
 *      (§37): sie sind jetzt der Hauptweg des leeren Chats, und der
 *      geschriebene Grund für 32 px („Nebenweg, weil aufklappbar") ging mit
 *      der Schublade (Durchsicht 10. Oktober: 28 bis 30 px gemessen).
 *   §4 DER KOPF. `#ai-mehr` (44 px, „Mehr KI-Funktionen") öffnet ein
 *      Tropfenmenü mit Agent, Besprechung und Protokoll; Escape schliesst
 *      jedes neue Menü und gibt den Fokus seinem Knopf zurück; die
 *      Tabulatortaste erreicht `#ai-quellen` und `#ai-mehr`.
 *   §5 DER FINGER. Am Telefon öffnen ein Tipp auf `#ai-quellen`, `#ai-mehr`
 *      und „Schreiben" ihr Menü — kein Weg hängt am Zeiger.
 *   §6 DIE EBENEN AM TELEFON. Bei 390 × 844 und 360 × 800 mit offenem
 *      Blatt liegen „+", Modus, Modell, Quellen, ⋯, das Befehlsmenü, eine
 *      Frage (Insel und Rückweg) und ein Hinweis ÜBER dem Blatt: ihre Ebene
 *      im Wurzelstapel ist höher, und mit `#ai.inert = false` trifft
 *      `elementFromPoint` in ihrer Mitte sie selbst (inert lässt die
 *      Trefferprüfung durch das gemalte Blatt hindurchsehen — ohne das
 *      Abschalten wäre die Probe blind, §55.2). Dazu die Wahl hinter einem
 *      getippten „@"; und jedes dieser Blätter nennt seinen Titel EINMAL
 *      (nicht als Blatt-Titel und gleich darunter noch einmal als Kopf).
 *   §7 EIN KATALOG, EIN LÄUFER. (a) Jeder Weg — Knopf im leeren Chat,
 *      Befehlsmenü, Schrägstrich, Palette, Fähigkeit — schickt für dieselbe
 *      Kennung dieselbe Anweisung. (b) Ein Befehl mit Markierung schickt NUR
 *      die Markierung und bietet „Markierung ersetzen". (c) Ein
 *      Seitenbefehl wirkt auch mit „Diese Seite" aus. (d) Die KI-Einträge der
 *      Palette kommen aus `Register.befehle`, `wissen` nennt `KI` nicht mehr.
 *      (e) Eigene Fähigkeiten aus `meta` stehen im Menü und laufen. (f)
 *      „Karteikarten" legt echte Karteikarten an. (g) Im Modus „Fragen"
 *      gibt es kein „Markierung ersetzen". (h) Die Auswahlleiste „✨ KI"
 *      öffnet das Befehlsmenü, oben „Zu dieser Stelle fragen" — und ein
 *      Befehl daraus ersetzt mit „Markierung ersetzen" die Stelle IM
 *      gespeicherten Text: die Auszeichnung davor bleibt, kein neuer Block
 *      entsteht. Am Block tauscht „Block ersetzen" den Text. Beide legen
 *      VORHER eine Fassung „vor KI-Änderung" an und markieren den Block mit
 *      herkunft „ki" (§21, E656). Der Weg „Blockmenü" in (a) fährt das
 *      echte Blockmenü; die alte Kennung `ai-edit` läuft daneben weiter.
 *   §8 VERBUNDENES HAT EINEN DRAHT. Eine gespiegelte Zeile (spiegelQuelle)
 *      steht im Kontext, wenn „Verbundenes" an ist, und fehlt, wenn es aus
 *      ist; eine eigene Datenbank bleibt davon unberührt.
 *   §9 EHRLICHE VERSPRECHEN. (b) „@Korrekturlesen …" führt die Fähigkeit
 *      auf dem Rest aus; ein getipptes „@" öffnet die Wahl mit Seiten UND
 *      Fähigkeiten. (c) „Seite erwähnen" — und die erwähnte Seite ist
 *      Kontext der nächsten Frage; eine erwähnte Seite, deren Titel mit dem
 *      Namen eines Befehls beginnt („Zusammenfassen Woche"), bleibt eine
 *      Erwähnung und startet keinen Befehl; Datenbankzeilen sind erwähnbar
 *      wie vorher (§17: eine Zeile ist eine Seite). (d) Ein Schalter in den Einstellungen
 *      bringt das Schild am Prompt mit. (e) Der Satz zum neuen Chat nennt
 *      genau die aktiven Quellen. (f) „Fähigkeit löschen" ist ein eigener
 *      Knopf, mit Tab erreichbar, fragt zuerst, Escape bricht ab. (g) Die
 *      Webfrage ist ein Redion-Fenster, kein `confirm()`.
 *  §10 DIE EINZELDATEI trägt dasselbe (file://).
 *  §11 RUHE. Mit `prefers-reduced-motion` und mit
 *      `body[data-bewegung="ruhig"]` läuft im Blatt und in seinen Menüen
 *      eine Zehntelsekunde nach dem Öffnen keine Animation mehr.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   Gegen den Stand 3d180c591 (claude/morgen-besser-2 mit ordner-bearbeiten
 *   und kein-toter-knopf) rot — die Zeilen stehen im Commit „test599 (rot)".
 *   Die Durchsicht-Zusagen (§3 am Telefon, §7h Ersetzen und Fassung, §7a
 *   echtes Blockmenü, §9c Erwähnung gegen Befehl und Zeilen) waren gegen
 *   d59c5bd35 rot — die Zeilen stehen im Commit „test599 (rot): Durchsicht".
 *   Die Gegenproben zu E724 stehen im Commit dazu.
 *
 *   node pruefungen/lauf/test599.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page, BrowserContext, Route } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2'
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
/* Ein freier Port vom System (L205) — kein fester. */
await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
const PORT = (server.address() as { port: number }).port;

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
/** Ein Abschnitt, der wirft, zählt als rot — und die übrigen laufen weiter. */
const abschnitt = async (name: string, fn: () => Promise<void>): Promise<void> => {
  try { await fn(); }
  catch (e) { p(name + ': lief durch', false, (e instanceof Error ? e.message : String(e)).split('\n')[0] ?? ''); }
};

const browser = await chromium.launch();
const fehler: string[] = [];
const warte = (s: Page, ms: number) => s.waitForTimeout(ms);

/* Was an das Modell ginge. Kein Netz: `/api/chat` antwortet aus dem Lauf. */
type Ruf = { system: string; user: string; alle: { role: string; content: string }[] };
const rufe: Ruf[] = [];
let antwortText = 'Testantwort.';
const modellAbfangen = async (s: Page): Promise<void> => {
  await s.route('**/api/chat', async (r: Route) => {
    let body: { messages?: { role: string; content: string }[] } = {};
    try { body = JSON.parse(r.request().postData() || '{}'); } catch { /* leer */ }
    const msgs = body.messages ?? [];
    rufe.push({ system: msgs.find(m => m.role === 'system')?.content ?? '',
      user: [...msgs].reverse().find(m => m.role === 'user')?.content ?? '', alle: msgs });
    await r.fulfill({ status: 200, contentType: 'application/x-ndjson',
      body: JSON.stringify({ message: { content: antwortText } }) + '\n' });
  });
  /* Wikipedia und alles Fremde: nie hinaus (§21). */
  await s.route(/wikipedia\.org/, r => r.abort());
};

const oeffnen = async (o: { breit: number; hoch: number; handy?: boolean; thema?: 'dark' | 'light';
  ruhig?: boolean; url?: string; inselnSperren?: boolean }): Promise<{ ctx: BrowserContext; s: Page }> => {
  const ctx = await browser.newContext({
    viewport: { width: o.breit, height: o.hoch }, serviceWorkers: 'block',
    ...(o.handy ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
    ...(o.ruhig ? { reducedMotion: 'reduce' as const } : {})
  });
  const s = await ctx.newPage();
  s.on('pageerror', e => fehler.push(e.message));
  /* Die Dienste der App sind `const` in klassischen Skripten — sie stehen
     im globalen Geltungsbereich, aber nicht an `window`. `__g` reicht sie
     durch (indirektes eval sieht diese Bindungen), ohne dass der Lauf jede
     Typendeklaration der App kennen muss. */
  await s.addInitScript(() => {
    const w = window as any;
    w.__g = new Proxy({}, {
      get: (_t, k) => { const n = String(k); if (n in w) return w[n]; try { return (0, eval)(n); } catch { return undefined; } },
      set: (_t, k, v) => { w[String(k)] = v; return true; }
    });
  });
  if (o.inselnSperren) await s.route(/islands|fremd\/react/, r => r.abort());
  await modellAbfangen(s);
  s.setDefaultTimeout(6000);
  await s.goto(o.url ?? `http://127.0.0.1:${PORT}/index.html`);
  await s.waitForFunction(() => typeof (window as any).__g.App !== 'undefined' && typeof (window as any).__g.Store !== 'undefined' &&
    (document.getElementById('tree')?.children.length || 0) > 0, null, { timeout: 30000 });
  await s.evaluate(async (t: string) => {
    const w = (window as any).__g;
    w.Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu')
      .forEach(el => el.remove());
    w.App.theme(t);
    const seite = w.Store.addPage(null, { text: 'Elektrotechnik Notizen' });
    w.Store.addBlock(seite.id, 'text', { text: 'Die Spanung ist proportinal zum Strom.' });
    w.Store.addBlock(seite.id, 'text', { text: 'Ohmsche Kartoffel bleibt das Merkwort dieser Seite.' });
    await w.Store.flush();
    w.App.oeffne(seite.id);
    w.KI.zustand.quelle = 'ollama'; w.KI.zustand.modell = 'pruef-599'; w.KI.zustand.bereit = true;
    w.__seite599 = seite.id;
  }, o.thema ?? 'dark');
  await s.mouse.move(2, 2);
  return { ctx, s };
};

const kiAuf = async (s: Page): Promise<void> => {
  await s.evaluate(() => (window as any).__g.App.kiPanel(true));
  await s.waitForSelector('#ai.open');
  await warte(s, 450);
};

/** Wartet, bis ein neuer Ruf ans Modell kam und die Antwort steht. */
const naechsterRuf = async (s: Page, vorher: number, ms = 4000): Promise<Ruf | null> => {
  const ende = Date.now() + ms;
  while (Date.now() < ende) {
    if (rufe.length > vorher) { await warte(s, 250); return rufe[rufe.length - 1] ?? null; }
    await warte(s, 60);
  }
  return null;
};

const menueZu = (s: Page) => s.evaluate(() => document.querySelectorAll('.menu,.menu-grund').forEach(m => m.remove()));
const dialogZu = async (s: Page): Promise<void> => {
  for (let i = 0; i < 3; i++) {
    const da = await s.evaluate(() => !!document.querySelector('.overlay, [data-insel-traeger]:not([data-insel-traeger="geht"])'));
    if (!da) return;
    await s.keyboard.press('Escape'); await warte(s, 250);
  }
  await s.evaluate(() => document.querySelectorAll('.overlay').forEach(o => o.remove()));
};
const dialogDa = (s: Page) => s.evaluate(() =>
  !!document.querySelector('.overlay:not([data-insel-traeger="geht"]), [data-insel-traeger]:not([data-insel-traeger="geht"])'));

/* Die Anweisung eines Katalogeintrags — oder null, wenn es keinen Katalog gibt. */
const auftragVon = (s: Page, id: string) => s.evaluate((k: string) => {
  const R = (window as any).__g.Register;
  const b = R && R.ki && R.ki.finde ? R.ki.finde(k) : null;
  return b ? String(b.auftrag).split('{')[0]!.trim() : null;
}, id);

/* ══ §1 + §2 + §3 + §4 am Rechner ══════════════════════════════════════════ */
for (const thema of ['dark', 'light'] as const) {
  console.log(`\n§1–§4 Am Rechner, 1440 × 900, ${thema}`);
  const { ctx, s } = await oeffnen({ breit: 1440, hoch: 900, thema });
  await kiAuf(s);

  await abschnitt('§1', async () => {
    p(`${thema} §1: es gibt keinen Sammelkasten #ai-tools`, await s.evaluate(() => !document.getElementById('ai-tools')));
    p(`${thema} §1: und keine Zeile „Werkzeuge & Kontext"`, await s.evaluate(() => !/Werkzeuge\s*&\s*Kontext/.test(document.getElementById('ai')?.textContent || '')));
  });

  await abschnitt('§2', async () => {
    const q = await s.evaluate(() => {
      const k = document.getElementById('ai-quellen');
      if (!k) return null;
      const r = k.getBoundingClientRect();
      const leiste = k.closest('.ai-compose .ai-leiste');
      const davor = k.previousElementSibling?.id ?? '';
      return { inLeiste: !!leiste, davor, b: Math.round(r.width), h: Math.round(r.height),
        label: k.getAttribute('aria-label') || '', expanded: k.getAttribute('aria-expanded'),
        sichtbar: r.width > 0 && r.height > 0 && getComputedStyle(k).visibility !== 'hidden' };
    });
    p(`${thema} §2: #ai-quellen steht in .ai-compose .ai-leiste gleich nach „+"`, q?.inLeiste && q.davor === 'ai-plus', JSON.stringify(q));
    p(`${thema} §2: … misst mindestens 44 × 44`, q && q.b >= 44 && q.h >= 44 && q.sichtbar, JSON.stringify(q));
    p(`${thema} §2: … sein Name nennt die aktiven Quellen`, q && /^Quellen: .*Diese Seite.*Arbeitsbereich.*Datenbanken/.test(q.label), q?.label ?? '');
    p(`${thema} §2: … und sagt, ob es offen ist (aria-expanded="false")`, q?.expanded === 'false', String(q?.expanded));
    await s.click('#ai-quellen');
    await warte(s, 350);
    const m = await s.evaluate(() => {
      const menu = document.querySelector('.menu');
      const chips = [...(menu?.querySelectorAll<HTMLElement>('[data-qs]') ?? [])];
      return { offen: !!menu, chips: chips.map(c => c.dataset.qs + ':' + c.getAttribute('aria-pressed')),
        nur: !!menu?.querySelector('[data-y="nur"][aria-pressed]'),
        einst: /Alle KI-Einstellungen/.test(menu?.textContent || ''),
        expanded: document.getElementById('ai-quellen')?.getAttribute('aria-expanded') };
    });
    p(`${thema} §2: ein Druck öffnet die fünf Quellen mit aria-pressed`, m.chips.length === 5 && m.chips.every(c => /:(true|false)$/.test(c)), JSON.stringify(m.chips));
    p(`${thema} §2: … dazu „Nur aus meinen Quellen" und „Alle KI-Einstellungen"`, m.nur && m.einst, JSON.stringify(m));
    p(`${thema} §2: … und der Knopf sagt aria-expanded="true"`, m.expanded === 'true', String(m.expanded));
    const kippen = await s.evaluate(async () => {
      const w = (window as any).__g;
      const vorher = !!w.Kontext.quellen().datenbanken;
      const labelVorher = document.getElementById('ai-quellen')?.getAttribute('aria-label') || '';
      const zahlVorher = (document.getElementById('ai-quellen')?.textContent || '').replace(/\D/g, '');
      document.querySelector<HTMLElement>('.menu [data-qs="datenbanken"]')?.click();
      await new Promise(f => setTimeout(f, 250));
      const nachher = !!w.Kontext.quellen().datenbanken;
      const labelNachher = document.getElementById('ai-quellen')?.getAttribute('aria-label') || '';
      const zahl = (document.getElementById('ai-quellen')?.textContent || '').replace(/\D/g, '');
      document.querySelector<HTMLElement>('.menu [data-qs="datenbanken"]')?.click();
      await new Promise(f => setTimeout(f, 200));
      return { vorher, nachher, labelVorher, labelNachher, zahlVorher, zahl, zurueck: !!w.Kontext.quellen().datenbanken };
    });
    p(`${thema} §2: ein Umschalter ändert Kontext.quellen`, kippen.vorher !== kippen.nachher && kippen.zurueck === kippen.vorher, JSON.stringify(kippen));
    p(`${thema} §2: … und das Schild des Knopfs (Name und Zahl)`, kippen.labelVorher !== kippen.labelNachher && !/Datenbanken/.test(kippen.labelNachher) &&
      kippen.zahlVorher !== '' && Number(kippen.zahl) === Number(kippen.zahlVorher) - 1, JSON.stringify(kippen));
    await s.keyboard.press('Escape'); await warte(s, 300);
    p(`${thema} §4: Escape schliesst das Quellenmenü und gibt den Fokus an #ai-quellen`, await s.evaluate(() =>
      !document.querySelector('.menu') && document.activeElement?.id === 'ai-quellen' &&
      document.getElementById('ai-quellen')?.getAttribute('aria-expanded') === 'false'));
  });

  await abschnitt('§3', async () => {
    const leer = await s.evaluate(() => {
      const st = document.querySelector<HTMLElement>('#ai .ai-start');
      if (!st) return null;
      const r = st.getBoundingClientRect();
      const db = document.getElementById('ai-db');
      const css = db ? getComputedStyle(db) : null;
      return { davor: st.previousElementSibling?.id ?? '', danach: st.nextElementSibling?.className ?? '',
        sichtbar: r.height > 0 && getComputedStyle(st).display !== 'none',
        titel: st.textContent?.includes('Für diese Seite'),
        dbDrin: !!st.querySelector('#ai-db') && !!st.querySelector('#ai-seite'),
        dbFarbe: css?.backgroundColor, dbBuchstaben: db?.querySelectorAll('.ru-funkel-b').length,
        funkel: st.querySelectorAll('button.ru-funkel').length };
    });
    p(`${thema} §3: .ai-start steht zwischen #chat und .ai-foot`, leer?.davor === 'chat' && /ai-foot/.test(leer.danach), JSON.stringify(leer));
    p(`${thema} §3: … und ist im leeren Chat sichtbar, „Für diese Seite"`, leer?.sichtbar && leer.titel, JSON.stringify(leer));
    p(`${thema} §3: #ai-db und #ai-seite stehen darin, mit dem Look aus E528`, leer?.dbDrin && /^rgba?\(16, 16, 16/.test(String(leer.dbFarbe)) && leer.dbBuchstaben === 14, JSON.stringify(leer));
    p(`${thema} §3: die acht Seitenaktionen sind Funkel-Knöpfe`, leer?.funkel === 8, String(leer?.funkel));
    const vor = rufe.length;
    await s.fill('#ai-input', 'Was steht auf dieser Seite?');
    await s.press('#ai-input', 'Enter');
    await naechsterRuf(s, vor);
    p(`${thema} §3: nach der ersten Frage ist der Block weg`, await s.evaluate(() => {
      const st = document.querySelector<HTMLElement>('#ai .ai-start');
      return !!st && getComputedStyle(st).display === 'none';
    }));
    await s.click('#ai-clear'); await warte(s, 300);
    p(`${thema} §3: nach „Neuer Chat" ist er wieder da`, await s.evaluate(() => {
      const st = document.querySelector<HTMLElement>('#ai .ai-start');
      return !!st && getComputedStyle(st).display !== 'none' && st.getBoundingClientRect().height > 0;
    }));
  });

  await abschnitt('§4', async () => {
    const k = await s.evaluate(() => {
      const b = document.getElementById('ai-mehr');
      if (!b) return null;
      const r = b.getBoundingClientRect();
      return { imKopf: !!b.closest('.ai-head'), vorZu: b.nextElementSibling?.id === 'ai-zu', b: Math.round(r.width), h: Math.round(r.height),
        label: b.getAttribute('aria-label'), popup: b.getAttribute('aria-haspopup'), expanded: b.getAttribute('aria-expanded') };
    });
    p(`${thema} §4: #ai-mehr steht im Kopf vor dem Schliessen-Knopf`, k?.imKopf && k.vorZu, JSON.stringify(k));
    p(`${thema} §4: … 44 × 44, „Mehr KI-Funktionen", aria-haspopup und aria-expanded`, k && k.b >= 44 && k.h >= 44 &&
      k.label === 'Mehr KI-Funktionen' && !!k.popup && k.expanded === 'false', JSON.stringify(k));
    await s.click('#ai-mehr'); await warte(s, 450);
    const m = await s.evaluate(() => {
      const menu = document.querySelector('.menu');
      return { tropfen: !!menu?.classList.contains('ru-tropfen-menue'),
        reihen: [...(menu?.querySelectorAll<HTMLElement>('button[id], button[data-y]') ?? [])].map(b => (b.id || b.dataset.y) + ''),
        text: (menu?.textContent || '').replace(/\s+/g, ' ') };
    });
    p(`${thema} §4: ⋯ öffnet ein Tropfenmenü mit Agent, Besprechung und Protokoll`, m.tropfen &&
      ['ai-agent', 'ai-meeting', 'ai-log'].every(id => m.reihen.includes(id)), JSON.stringify(m.reihen));
    p(`${thema} §4: … und Fähigkeiten verwalten, Personalisieren, MCP-Server, KI-Einstellungen`,
      /Fähigkeiten verwalten/.test(m.text) && /Personalisieren/.test(m.text) && /MCP-Server/.test(m.text) && /KI-Einstellungen/.test(m.text), m.text.slice(0, 200));
    p(`${thema} §4: … kein „Modus ▸" mehr irgendwo (der Modus wohnt am Knopf)`, !/Modus\s*▸/.test(m.text), m.text.slice(0, 120));
    await s.keyboard.press('Escape'); await warte(s, 300);
    p(`${thema} §4: Escape schliesst ⋯ und gibt den Fokus an #ai-mehr`, await s.evaluate(() =>
      !document.querySelector('.menu') && document.activeElement?.id === 'ai-mehr'));
    /* Tab erreicht beide: vom Neuer-Chat-Knopf zum ⋯, von „+" zu den Quellen. */
    await s.focus('#ai-clear'); await s.keyboard.press('Tab');
    const tab1 = await s.evaluate(() => document.activeElement?.id);
    await s.focus('#ai-plus'); await s.keyboard.press('Tab');
    const tab2 = await s.evaluate(() => document.activeElement?.id);
    p(`${thema} §4: Tab erreicht #ai-mehr und #ai-quellen`, tab1 === 'ai-mehr' && tab2 === 'ai-quellen', tab1 + ' · ' + tab2);
    /* Das Befehlsmenü und „+" schliessen auch mit Escape und geben den Fokus zurück. */
    for (const sel of ['#ai-plus', '.ai-start #ai-schreiben']) {
      const da = await s.evaluate((q: string) => !!document.querySelector(q), sel);
      if (!da) { p(`${thema} §4: ${sel} ist da`, false); continue; }
      await s.click(sel); await warte(s, 350);
      await s.keyboard.press('Escape'); await warte(s, 300);
      p(`${thema} §4: Escape schliesst das Menü von ${sel} und gibt ihm den Fokus`, await s.evaluate((q: string) =>
        !document.querySelector('.menu') && document.activeElement === document.querySelector(q), sel));
    }
  });

  await abschnitt('§1 Wirkung', async () => {
    if (thema !== 'dark') return;
    /* Jeder der 19 früheren Einträge, an seiner Wirkung. */
    const wirk: Record<string, boolean> = {};
    /* 1–5 Quellen: im Quellenmenü, ein Druck schaltet (Web fragt zuerst). */
    for (const k of ['aktuelleSeite', 'arbeitsbereich', 'datenbanken', 'verbindungen']) {
      await menueZu(s);
      await s.click('#ai-quellen').catch(() => {}); await warte(s, 300);
      wirk['qs:' + k] = await s.evaluate(async (q: string) => {
        const w = (window as any).__g; const v = !!w.Kontext.quellen()[q];
        const b = document.querySelector<HTMLElement>('.menu [data-qs="' + q + '"]');
        if (!b) return false;
        b.click(); await new Promise(f => setTimeout(f, 150));
        const n = !!w.Kontext.quellen()[q];
        w.Kontext.quelleSetzen(q, v);
        return n !== v;
      }, k);
    }
    await menueZu(s);
    await s.click('#ai-quellen').catch(() => {}); await warte(s, 300);
    await s.evaluate(() => document.querySelector<HTMLElement>('.menu [data-qs="web"]')?.click());
    await warte(s, 600);
    wirk['qs:web'] = await dialogDa(s);
    await dialogZu(s); await menueZu(s);
    /* 6, 7: die Bau-Knöpfe fragen. */
    for (const id of ['ai-db', 'ai-seite']) {
      const da = await s.evaluate((i: string) => !!document.querySelector('.ai-start #' + i), id);
      if (da) { await s.click('#' + id); await warte(s, 600); wirk[id] = await dialogDa(s); await dialogZu(s); }
      else wirk[id] = false;
    }
    /* 8: Schreiben öffnet das Befehlsmenü. */
    if (await s.evaluate(() => !!document.querySelector('.ai-start #ai-schreiben'))) {
      await s.click('#ai-schreiben'); await warte(s, 350);
      wirk['ai-schreiben'] = await s.evaluate(() => (document.querySelector('.menu')?.querySelectorAll('[data-sb]').length || 0) >= 10);
      await menueZu(s);
    } else wirk['ai-schreiben'] = false;
    /* 9, 10, 11, 13, 14: die fünf Aufträge laufen (Übersetzen fragt zuerst). */
    for (const id of ['zusammenfassen', 'aufgaben', 'besser', 'karteikarten']) {
      const vor = rufe.length;
      const da = await s.evaluate((i: string) => { const b = document.querySelector<HTMLElement>('.ai-start [data-ki="' + i + '"]'); b?.click(); return !!b; }, id);
      wirk['chip:' + id] = da && !!(await naechsterRuf(s, vor));
      await s.click('#ai-clear').catch(() => {}); await warte(s, 250);
    }
    if (await s.evaluate(() => !!document.querySelector('.ai-start [data-ki="uebersetzen"]'))) {
      await s.click('.ai-start [data-ki="uebersetzen"]'); await warte(s, 600);
      wirk['chip:uebersetzen'] = await dialogDa(s); await dialogZu(s);
    } else wirk['chip:uebersetzen'] = false;
    /* 12: Nachschlagen im „+". */
    await s.click('#ai-plus'); await warte(s, 300);
    const wiki = await s.evaluate(() => { const b = document.querySelector<HTMLElement>('.menu [data-x="wiki"]'); b?.click(); return !!b; });
    await warte(s, 600);
    wirk['ai-wiki'] = wiki && await dialogDa(s); await dialogZu(s); await menueZu(s);
    /* 15–17 im Kopf. */
    for (const id of ['ai-agent', 'ai-meeting', 'ai-log']) {
      await menueZu(s);
      if (!await s.evaluate(() => !!document.getElementById('ai-mehr'))) { wirk[id] = false; continue; }
      await s.click('#ai-mehr'); await warte(s, 400);
      wirk[id] = await s.evaluate(async (i: string) => {
        const w = (window as any).__g;
        let gerufen = false;
        const alt = { a: w.Agent?.panel, m: w.Meeting?.panel };
        if (w.Agent) w.Agent.panel = () => { gerufen = true; };
        if (w.Meeting) w.Meeting.panel = () => { gerufen = true; };
        const vor = document.querySelectorAll('.overlay').length;
        const b = document.querySelector<HTMLElement>('.menu #' + i);
        b?.click(); await new Promise(f => setTimeout(f, 300));
        if (w.Agent) w.Agent.panel = alt.a;
        if (w.Meeting) w.Meeting.panel = alt.m;
        const neu = document.querySelectorAll('.overlay').length > vor;
        return !!b && (gerufen || neu);
      }, id);
      await dialogZu(s); await menueZu(s);
    }
    /* 18: MCP-Server und Personalisieren im ⋯. */
    await s.click('#ai-mehr').catch(() => {}); await warte(s, 400);
    wirk['ai-quellen:mcp+pers'] = await s.evaluate(() => !!document.querySelector('.menu [data-y="mcp"]') && !!document.querySelector('.menu [data-y="pers"]'));
    await menueZu(s);
    /* 19: Befehle und Fähigkeiten im „+". */
    await s.click('#ai-plus'); await warte(s, 300);
    const f = await s.evaluate(() => { const b = document.querySelector<HTMLElement>('.menu #ai-faehig'); b?.click(); return !!b; });
    await warte(s, 350);
    wirk['ai-faehig'] = f && await s.evaluate(() => !!document.querySelector('.menu [data-f="__neu"]') && (document.querySelectorAll('.menu [data-f]').length >= 5));
    await menueZu(s);
    const falsch = Object.entries(wirk).filter(([, v]) => !v).map(([k]) => k);
    console.log('    Wirkungen: ' + Object.keys(wirk).length + ' geprüft');
    p('§1: alle 19 früheren Einträge wirken von ihrem neuen Ort aus (≤ 2 Handgriffe)',
      Object.keys(wirk).length >= 19 && falsch.length === 0, 'ohne Wirkung: ' + falsch.join(', '));
  });
  await ctx.close();
}

/* ══ §3 bei 800 × 900 — Redurs Fenster ═════════════════════════════════════ */
await abschnitt('§3 800', async () => {
  console.log('\n§3 Redurs Fenster, 800 × 900');
  const { ctx, s } = await oeffnen({ breit: 800, hoch: 900 });
  await kiAuf(s);
  const m = await s.evaluate(() => {
    const st = document.querySelector('#ai .ai-start');
    const kn = [...(st?.querySelectorAll<HTMLElement>('button') ?? [])];
    const chat = document.getElementById('chat')!.getBoundingClientRect();
    const draussen = kn.filter(b => { const r = b.getBoundingClientRect(); return r.top < 0 || r.bottom > innerHeight || r.width === 0; })
      .map(b => (b.textContent || '').trim());
    return { anzahl: kn.length, draussen, chat: Math.round(chat.height) };
  });
  console.log('    Chat ' + m.chat + ' px hoch, ' + m.anzahl + ' Knöpfe im leeren Chat');
  p('§3 800: alle Knöpfe des leeren Chats stehen ohne Rollen im Bild', m.anzahl >= 8 && m.draussen.length === 0, JSON.stringify(m));
  p('§3 800: und der Chat behält mindestens 300 px', m.chat >= 300, String(m.chat));
  await ctx.close();
});

/* ══ §5 + §6 am Telefon ════════════════════════════════════════════════════ */
for (const [breit, hoch] of [[390, 844], [360, 800]] as const) {
  console.log(`\n§5–§6 Telefon ${breit} × ${hoch}`);
  const { ctx, s } = await oeffnen({ breit, hoch, handy: true });
  await kiAuf(s);
  await warte(s, 400);
  /** Die Ebene eines Elements im Wurzelstapel: sein Vorfahr direkt unter body. */
  const probe = async (name: string, sel: string): Promise<void> => {
    const r = await s.evaluate((q: string) => {
      const el = [...document.querySelectorAll<HTMLElement>(q)].filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; }).pop();
      if (!el) return null;
      const wurzel = (e: Element): Element => { let x: Element = e; while (x.parentElement && x.parentElement !== document.body) x = x.parentElement; return x; };
      const z = (e: Element) => parseInt(getComputedStyle(wurzel(e)).zIndex, 10) || 0;
      const ai = document.getElementById('ai')!;
      const war = ai.inert; ai.inert = false;
      /* Ein Hinweis trägt `pointer-events:none` — die Trefferprüfung sähe
         durch ihn hindurch, auch wenn er oben liegt. Für die Probe trägt er
         Zeigerereignisse; gefragt ist, was GEMALT oben liegt. */
      const w0 = wurzel(el) as HTMLElement;
      const pe = [el.style.pointerEvents, w0.style.pointerEvents];
      el.style.pointerEvents = 'auto'; w0.style.pointerEvents = 'auto';
      const b = el.getBoundingClientRect();
      const x = Math.min(innerWidth - 2, Math.max(1, b.left + b.width / 2));
      const y = Math.min(innerHeight - 2, Math.max(1, b.top + Math.min(b.height / 2, 30)));
      const oben = document.elementFromPoint(x, y);
      ai.inert = war;
      el.style.pointerEvents = pe[0] ?? ''; w0.style.pointerEvents = pe[1] ?? '';
      const wurzelEl = wurzel(el);
      return { z: z(el), ai: z(ai), getroffen: !!oben && (el.contains(oben) || wurzelEl.contains(oben)),
        oben: oben ? (oben.id || oben.className || oben.tagName).toString().slice(0, 40) : '' };
    }, sel);
    p(`${breit} §6: ${name} liegt über dem Blatt (Ebene und Treffer)`, r && r.z > r.ai && r.getroffen, JSON.stringify(r));
  };
  /* Ein Blatt sagt seinen Namen EINMAL: der Titel des Blattes steht nicht
     gleich darunter noch einmal als Kopf (gesehen im Bild: „KI-Befehle" und
     „Erwähnen" je zweimal übereinander — eine Text-Doppelung, wie Redur sie
     am 3. Oktober aus dem Kopf nehmen liess). */
  const einmalBenannt = async (name: string): Promise<void> => {
    const r = await s.evaluate(() => {
      const m = [...document.querySelectorAll<HTMLElement>('.menu')].pop();
      const titel = (m?.querySelector('.blatt-titel')?.textContent || '').trim();
      const koepfe = [...(m?.querySelectorAll<HTMLElement>('.grp') ?? [])].map(g => (g.textContent || '').trim());
      return { titel, koepfe: koepfe.slice(0, 3), doppelt: !!titel && koepfe.includes(titel) };
    });
    p(`${breit} §6: ${name} nennt seinen Titel einmal`, !r.doppelt, JSON.stringify(r));
  };
  /* §3 am Telefon: die acht Seitenaktionen sind der Hauptweg des leeren
     Chats, also 44 px (§37). In der Schublade galten sie als Nebenweg mit
     32 px, „weil aufklappbar" — der Grund ging mit der Schublade. */
  await abschnitt(`${breit} §3`, async () => {
    const k = await s.evaluate(() => [...document.querySelectorAll<HTMLElement>('#ai .ai-start button')]
      .map(b => ({ t: (b.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 18), h: Math.round(b.getBoundingClientRect().height * 10) / 10 })));
    const klein = k.filter(x => x.h < 44);
    p(`${breit} §3: jede der acht Seitenaktionen misst mindestens 44 px (§37)`, k.length >= 8 && klein.length === 0,
      k.length + ' Knöpfe, zu klein: ' + JSON.stringify(klein));
  });
  await abschnitt(`${breit} §6`, async () => {
    for (const [name, knopf] of [['„+"', '#ai-plus'], ['Modus', '#ai-modus'], ['Modell', '.ai-compose .model-btn'],
      ['Quellen', '#ai-quellen'], ['⋯', '#ai-mehr'], ['Befehlsmenü', '.ai-start #ai-schreiben']] as const) {
      await menueZu(s);
      const da = await s.evaluate((q: string) => !!document.querySelector(q), knopf);
      if (!da) { p(`${breit} §6: ${name} hat einen Knopf (${knopf})`, false); continue; }
      await s.evaluate((q: string) => document.querySelector<HTMLElement>(q)?.click(), knopf);
      await warte(s, 500);
      await probe(name, '.menu');
      await einmalBenannt(name);
      await menueZu(s); await warte(s, 150);
    }
    /* Die Wahl hinter einem getippten „@" — auch sie ist ein Blatt. */
    await menueZu(s);
    await s.focus('#ai-input'); await s.keyboard.type('@'); await warte(s, 500);
    await probe('die Wahl hinter „@"', '.menu');
    await einmalBenannt('die Wahl hinter „@"');
    await menueZu(s);
    await s.evaluate(() => { const t = document.getElementById('ai-input') as HTMLTextAreaElement | null; if (t) t.value = ''; });
    /* Eine Frage: die Insel des Kits (E710). */
    await s.evaluate(() => document.querySelector<HTMLElement>('#ai-db')?.click());
    await s.waitForSelector('[data-insel-traeger]:not([data-insel-traeger="geht"]), .overlay', { timeout: 6000 }).catch(() => {});
    await warte(s, 500);
    await probe('eine Frage (Insel)', '[data-insel-traeger]:not([data-insel-traeger="geht"]) *, .overlay > *');
    await dialogZu(s);
    /* Ein Hinweis. */
    await s.evaluate(() => (window as any).__g.UI.toast('Hinweis über dem Blatt'));
    await warte(s, 400);
    await probe('ein Hinweis', '#toast');
  });
  await abschnitt(`${breit} §5`, async () => {
    for (const knopf of ['#ai-quellen', '#ai-mehr', '.ai-start #ai-schreiben']) {
      await menueZu(s);
      const ort = await s.evaluate((q: string) => {
        const b = document.querySelector<HTMLElement>(q); if (!b) return null;
        b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }, knopf);
      if (!ort) { p(`${breit} §5: ${knopf} ist da`, false); continue; }
      await s.touchscreen.tap(ort.x, ort.y); await warte(s, 500);
      p(`${breit} §5: ein Tipp auf ${knopf} öffnet sein Menü`, await s.evaluate(() => !!document.querySelector('.menu')));
    }
    await menueZu(s);
  });
  await ctx.close();
}

/* Die Frage im Rückweg ohne Inseln (…Alt, ein .overlay). */
await abschnitt('390 §6 Rückweg', async () => {
  const { ctx, s } = await oeffnen({ breit: 390, hoch: 844, handy: true, inselnSperren: true });
  await kiAuf(s);
  await s.evaluate(() => document.querySelector<HTMLElement>('#ai-db')?.click());
  await s.waitForSelector('.overlay', { timeout: 8000 }).catch(() => {});
  await warte(s, 400);
  const r = await s.evaluate(() => {
    const o = [...document.querySelectorAll<HTMLElement>('.overlay')].pop();
    if (!o) return null;
    const ai = document.getElementById('ai')!;
    const war = ai.inert; ai.inert = false;
    const kind = o.firstElementChild as HTMLElement | null;
    const b = (kind ?? o).getBoundingClientRect();
    const oben = document.elementFromPoint(b.left + b.width / 2, b.top + Math.min(20, b.height / 2));
    ai.inert = war;
    return { z: parseInt(getComputedStyle(o).zIndex, 10) || 0, ai: parseInt(getComputedStyle(ai).zIndex, 10) || 0,
      getroffen: !!oben && o.contains(oben) };
  });
  p('390 §6: die Frage im Rückweg ohne Inseln liegt über dem Blatt', r && r.z > r.ai && r.getroffen, JSON.stringify(r));
  await ctx.close();
});

/* ══ §7 Ein Katalog, ein Läufer ════════════════════════════════════════════ */
await abschnitt('§7', async () => {
  console.log('\n§7 Ein Katalog, ein Läufer');
  const { ctx, s } = await oeffnen({ breit: 1440, hoch: 900 });
  await kiAuf(s);
  const markiere = (satz: string) => s.evaluate((t: string) => {
    const ct = [...document.querySelectorAll<HTMLElement>('#page .blk .ct')].find(c => (c.textContent || '').includes(t));
    if (!ct) return false;
    const knoten = document.createTreeWalker(ct, NodeFilter.SHOW_TEXT);
    let n: Node | null; while ((n = knoten.nextNode())) {
      const i = (n.textContent || '').indexOf(t);
      if (i >= 0) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + t.length);
        const sel = getSelection()!; sel.removeAllRanges(); sel.addRange(r); return true; }
    }
    return false;
  }, satz);
  const ohneMarkierung = () => s.evaluate(() => getSelection()?.removeAllRanges());
  const leeren = async () => { await s.click('#ai-clear').catch(() => {}); await warte(s, 200); };

  /* (a) Dieselbe Anweisung auf jedem Weg. */
  const wege = async (id: string, liste: [string, string][]): Promise<void> => {
    const soll = await auftragVon(s, id);
    const systeme: Record<string, string> = {};
    for (const [name, js] of liste) {
      await ohneMarkierung(); await leeren(); await menueZu(s);
      const vor = rufe.length;
      const gelaufen = await s.evaluate(js).then(() => true, () => false);
      await warte(s, 300);
      const ruf = gelaufen ? await naechsterRuf(s, vor) : null;
      systeme[name] = ruf ? ruf.system : '(kein Ruf)';
    }
    const werte = Object.values(systeme);
    const gleich = werte.every(v => v === werte[0]) && !werte.includes('(kein Ruf)');
    const drin = !!soll && werte.every(v => v.includes(soll));
    console.log(`    ${id}: ${Object.entries(systeme).map(([k, v]) => k + '=' + (v === '(kein Ruf)' ? v : v.length + ' Z.')).join(' · ')}`);
    p(`§7a: „${id}" schickt auf allen ${liste.length} Wegen dieselbe Anweisung aus dem Katalog`, gleich && drin,
      Object.entries(systeme).map(([k, v]) => k + ': ' + v.replace(/\s+/g, ' ').slice(-90)).join(' | '));
  };
  const mitSeite = '(window).__g.Store.getBlock((window).__g.__seite599)';
  await wege('zusammenfassen', [
    ['Knopf', `document.querySelector('.ai-start [data-ki="zusammenfassen"]').click()`],
    ['Befehlsmenü', `(async()=>{(window).__g.KI.schreibMenue(document.getElementById('ai-input'));await new Promise(f=>setTimeout(f,200));document.querySelector('.menu [data-sb="zusammenfassen"]').click()})()`],
    ['Schrägstrich', `(window).__g.KI.blockAktion('ai-summary', ${mitSeite})`],
    ['Palette', `(window).__g.Register.befehle.alle().find(b=>b.gruppe==='KI'&&/Zusammenfassen/.test(b.titel)).tun()`]
  ]);
  await wege('besser', [
    ['Knopf', `document.querySelector('.ai-start [data-ki="besser"]').click()`],
    ['Befehlsmenü', `(async()=>{(window).__g.KI.schreibMenue(document.getElementById('ai-input'));await new Promise(f=>setTimeout(f,200));document.querySelector('.menu [data-sb="besser"]').click()})()`],
    /* Das ECHTE Blockmenü: „Mit KI bearbeiten" am Block öffnet das
       Befehlsmenü (E724). Bis zur Durchsicht hiess hier ein Aufruf der alten
       Kennung „Blockmenü" — gemessen war damit ein Weg, den das Menü nicht
       mehr nimmt. Die alte Kennung läuft weiter, unter ihrem Namen. */
    ['Blockmenü', `(async()=>{const w=(window).__g;const b=w.Store.childrenOf(w.__seite599).find(x=>/Ohmsche/.test(x.text||''));w.Blocks.blockMenue(document.querySelector('.blk[data-bid="'+b.id+'"]'),b);await new Promise(f=>setTimeout(f,250));document.querySelector('.menu [data-a="ai"]').click();await new Promise(f=>setTimeout(f,300));document.querySelector('.menu [data-sb="besser"]').click()})()`],
    ['alte Kennung ai-edit', `(window).__g.KI.blockAktion('ai-edit', ${mitSeite})`],
    ['Schrägstrich', `(window).__g.KI.blockAktion('ai-improve', ${mitSeite})`],
    ['Fähigkeit', `(async()=>{(window).__g.KI.faehigkeitenMenue(document.getElementById('ai-input'));await new Promise(f=>setTimeout(f,200));document.querySelector('.menu [data-f="stil"]').click()})()`]
  ]);

  /* (b) Fähigkeit mit Markierung: nur die Markierung, und „Markierung ersetzen". */
  await leeren();
  const satz = 'Die Spanung ist proportinal zum Strom.';
  p('§7b: die Markierung steht', await markiere(satz));
  let vor = rufe.length;
  await s.evaluate(async () => { (window as any).__g.KI.faehigkeitenMenue(document.getElementById('ai-input'));
    await new Promise(f => setTimeout(f, 200)); document.querySelector<HTMLElement>('.menu [data-f="korrek"]')?.click(); });
  let ruf = await naechsterRuf(s, vor);
  const korrek = await auftragVon(s, 'recht');
  p('§7b: „Korrekturlesen" mit Markierung schickt NUR die Markierung', ruf?.user === satz, JSON.stringify(ruf?.user ?? null).slice(0, 120));
  p('§7b: … mit der Anweisung aus dem Katalog im System', !!korrek && !!ruf?.system.includes(korrek), String(korrek));
  p('§7b: … und bietet „Markierung ersetzen"', await s.evaluate(() => !!document.querySelector('#chat .ki-antwortknoepfe [data-a="ersetzen"]')));

  /* (g) Im Modus „Fragen" kein Ersetzen. */
  await leeren(); await markiere(satz);
  await s.evaluate(() => { (window as any).__g.KI.zustand.modus = 'fragen'; });
  vor = rufe.length;
  await s.evaluate(async () => { (window as any).__g.KI.faehigkeitenMenue(document.getElementById('ai-input'));
    await new Promise(f => setTimeout(f, 200)); document.querySelector<HTMLElement>('.menu [data-f="korrek"]')?.click(); });
  ruf = await naechsterRuf(s, vor);
  p('§7g: im Modus „Fragen" steht kein „Markierung ersetzen" da', !!ruf && await s.evaluate(() =>
    !!document.querySelector('#chat .ki-antwortknoepfe') && !document.querySelector('#chat .ki-antwortknoepfe [data-a="ersetzen"]')));
  await s.evaluate(() => { (window as any).__g.KI.zustand.modus = 'standard'; });

  /* (c) Ein Seitenbefehl wirkt auch mit „Diese Seite" aus. */
  await leeren(); await ohneMarkierung();
  await s.evaluate(() => (window as any).__g.Kontext.quelleSetzen('aktuelleSeite', false));
  vor = rufe.length;
  await s.evaluate(() => document.querySelector<HTMLElement>('.ai-start [data-ki="zusammenfassen"]')?.click());
  ruf = await naechsterRuf(s, vor);
  p('§7c: „Zusammenfassen" mit „Diese Seite" aus bekommt die Seite trotzdem', !!ruf && /Ohmsche Kartoffel/.test(ruf.user + ruf.system),
    ruf ? ruf.user.slice(0, 80) : '(kein Ruf)');
  await s.evaluate(() => (window as any).__g.Kontext.quelleSetzen('aktuelleSeite', true));

  /* (d) Die Palette bekommt ihre KI-Einträge aus Register.befehle. */
  const pal = await s.evaluate(() => (window as any).__g.Register.befehle.alle().filter((b: any) => b.gruppe === 'KI').map((b: any) => b.titel));
  const vier = ['Datenbank von der KI bauen lassen', 'Seitenaufbau von der KI', 'Nachschlagen bei Wikipedia', 'Protokoll: was die KI gebaut hat'];
  p('§7d: die vier KI-Befehle der Palette kommen aus Register.befehle', vier.every(t => pal.includes(t)), JSON.stringify(pal));
  const wissen = fs.readFileSync(path.join(WURZEL, 'src/bereiche/wissen/werkzeuge.ts'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const kiNamen = (wissen.match(/\bKI\.[a-zA-Z]+/g) || []).length;
  p('§7d: wissen nennt KI nicht mehr (die vier Abschriften sind weg)', kiNamen === 0, kiNamen + ' Stellen');

  /* (e) Eigene Fähigkeit aus meta: steht im Menü und läuft. */
  await leeren(); await ohneMarkierung();
  await s.evaluate(() => (window as any).__g.KI.faehigkeitSichern({ id: 'eigen599', icon: '🎯', name: 'Auf den Punkt', auftrag: 'Kürze auf einen Satz.' }));
  vor = rufe.length;
  const imMenue = await s.evaluate(async () => { (window as any).__g.KI.faehigkeitenMenue(document.getElementById('ai-input'));
    await new Promise(f => setTimeout(f, 200)); const b = document.querySelector<HTMLElement>('.menu [data-f="eigen599"]'); b?.click(); return !!b; });
  ruf = await naechsterRuf(s, vor);
  p('§7e: die eigene Fähigkeit steht im Befehlsmenü', imMenue);
  p('§7e: … und läuft: ihre Anweisung im System, der Text als Eingabe', !!ruf && ruf.system.includes('Kürze auf einen Satz.') && /Ohmsche Kartoffel/.test(ruf.user),
    ruf ? JSON.stringify({ user: ruf.user.slice(0, 60) }) : '(kein Ruf)');
  await s.evaluate(() => (window as any).__g.KI.faehigkeitLoeschen('eigen599'));

  /* (f) Karteikarten sind Karteikarten. */
  await leeren();
  antwortText = 'Was ist U? :: Die Spannung\nWas ist I? :: Der Strom';
  vor = rufe.length;
  await s.evaluate(() => document.querySelector<HTMLElement>('.ai-start [data-ki="karteikarten"]')?.click());
  ruf = await naechsterRuf(s, vor);
  const karten = await s.evaluate(async () => {
    const w = (window as any).__g;
    const b = document.querySelector<HTMLElement>('#chat [data-a="karteikarten"]');
    if (!b) return { knopf: false, text: '', karten: [] as string[] };
    const text = (b.textContent || '').trim();
    b.click(); await new Promise(f => setTimeout(f, 300));
    return { knopf: true, text, karten: w.Store.childrenOf(w.__seite599).filter((x: any) => x.type === 'flashcard').map((x: any) => x.text) };
  });
  antwortText = 'Testantwort.';
  p('§7f: „Karteikarten" bietet „Als Karteikarten einfügen"', karten.knopf && /Karteikarten einfügen/.test(karten.text), JSON.stringify(karten));
  p('§7f: … und legt echte Karteikarten an (Typ flashcard)', karten.karten.length === 2 && karten.karten[0] === 'Was ist U? :: Die Spannung', JSON.stringify(karten.karten));

  /* (h) Die Auswahlleiste „✨ KI" öffnet das Befehlsmenü. */
  await leeren();
  await markiere(satz);
  await s.evaluate(() => (window as any).__g.Auswahl?.zeigen());
  await warte(s, 200);
  await s.evaluate(() => document.querySelector<HTMLElement>('.auswahlleiste [data-a="ki"]')?.click());
  await warte(s, 400);
  const leiste = await s.evaluate(() => {
    const m = document.querySelector('.menu');
    const erste = m?.querySelector<HTMLElement>('.menu-liste button, button');
    return { menue: !!m, erste: (erste?.textContent || '').trim(), befehle: m?.querySelectorAll('[data-sb]').length || 0 };
  });
  p('§7h: „✨ KI" öffnet das Befehlsmenü, oben „Zu dieser Stelle fragen"', leiste.menue && /Zu dieser Stelle fragen/.test(leiste.erste) && leiste.befehle >= 10, JSON.stringify(leiste));
  await s.evaluate(() => document.querySelector<HTMLElement>('.menu [data-k="fragen"]')?.click());
  await warte(s, 300);
  p('§7h: … und die erste Zeile tut, was „✨ KI" bisher tat', await s.evaluate(() =>
    /Zu dieser Stelle: „Die Spanung/.test((document.getElementById('ai-input') as HTMLTextAreaElement).value)));

  /* (h) „✨ KI" → Befehl → „Markierung ersetzen" tauscht IM gespeicherten
     Text, hinter einer Auszeichnung (Durchsicht 10. Oktober: der Block blieb
     unverändert, und die Antwort stand als NEUER Block am Ende der Seite —
     das Suchfeld des Menüs nahm die Auswahl mit, und gemerkt war keine). */
  await menueZu(s); await leeren(); await ohneMarkierung();
  await s.evaluate(() => { (document.getElementById('ai-input') as HTMLTextAreaElement).value = ''; });
  const fettId = await s.evaluate(async () => {
    const w = (window as any).__g;
    const b = w.Store.addBlock(w.__seite599, 'text', { text: 'Eins **fett** und die Lötstelle ist kallt.' });
    await w.Store.flush(); w.App.zeichneSeite();
    return String(b.id);
  });
  await warte(s, 300);
  const zaehle = () => s.evaluate(() => { const w = (window as any).__g;
    return w.Store.childrenOf(w.__seite599).filter((x: any) => x.alive !== false).length as number; });
  const fassungen = () => s.evaluate(async () => { const w = (window as any).__g;
    return (await w.Store.versionen(w.__seite599)).filter((v: any) => v.anlass === 'vor KI-Änderung').length as number; });
  const blockNach = () => s.evaluate((id: string) => { const b = (window as any).__g.Store.getBlock(id);
    return { text: String(b?.text ?? ''), herkunft: String(b?.herkunft ?? '') }; }, fettId);
  const ersetzeKlick = () => s.evaluate(async () => {
    const b = [...document.querySelectorAll<HTMLElement>('#chat .ki-antwortknoepfe [data-a="ersetzen"]')].pop();
    const name = (b?.textContent || '').trim();
    b?.click(); await new Promise(f => setTimeout(f, 600));
    return name;
  });
  const bloeckeVor = await zaehle();
  const fassVor = await fassungen();
  p('§7h: die Markierung hinter **fett** steht', await markiere('die Lötstelle ist kallt'));
  await s.evaluate(() => (window as any).__g.Auswahl?.zeigen());
  await warte(s, 200);
  await s.evaluate(() => document.querySelector<HTMLElement>('.auswahlleiste [data-a="ki"]')?.click());
  await warte(s, 400);
  antwortText = 'die Lötstelle ist kalt';
  vor = rufe.length;
  await s.evaluate(() => document.querySelector<HTMLElement>('.menu [data-sb="recht"]')?.click());
  ruf = await naechsterRuf(s, vor);
  p('§7h: „✨ KI" → „Korrekturlesen" schickt die Markierung', ruf?.user === 'die Lötstelle ist kallt', JSON.stringify(ruf?.user ?? null));
  const ersName = await ersetzeKlick();
  antwortText = 'Testantwort.';
  const nach1 = await blockNach();
  const bloeckeNach = await zaehle();
  const fassNach = await fassungen();
  p('§7h: … „Markierung ersetzen" tauscht im gespeicherten Text, **fett** bleibt',
    ersName === 'Markierung ersetzen' && nach1.text === 'Eins **fett** und die Lötstelle ist kalt.', JSON.stringify({ ersName, ...nach1 }));
  p('§7h: … und legt keinen neuen Block an', bloeckeNach === bloeckeVor, `${bloeckeVor} → ${bloeckeNach} Blöcke`);
  p('§7h: … vorher eine Fassung „vor KI-Änderung", der Block trägt herkunft „ki" (§21, E656)',
    fassNach === fassVor + 1 && nach1.herkunft === 'ki', JSON.stringify({ fassVor, fassNach, herkunft: nach1.herkunft }));

  /* Am Block: „Mit KI bearbeiten" → „Text verbessern" → „Block ersetzen"
     tauscht den GANZEN Text — gerade deshalb mit Fassung davor. */
  await menueZu(s); await leeren(); await ohneMarkierung();
  const fassVor2 = await fassungen();
  antwortText = 'Zwei **fett** und die Lötstelle ist kalt.';
  vor = rufe.length;
  await s.evaluate(async (id: string) => {
    const w = (window as any).__g;
    w.Blocks.blockMenue(document.querySelector(`.blk[data-bid="${id}"]`), w.Store.getBlock(id));
    await new Promise(f => setTimeout(f, 250));
    document.querySelector<HTMLElement>('.menu [data-a="ai"]')?.click();
    await new Promise(f => setTimeout(f, 300));
    document.querySelector<HTMLElement>('.menu [data-sb="besser"]')?.click();
  }, fettId);
  ruf = await naechsterRuf(s, vor);
  const ersName2 = await ersetzeKlick();
  antwortText = 'Testantwort.';
  const nach2 = await blockNach();
  const fassNach2 = await fassungen();
  p('§7h: am Block tauscht „Block ersetzen" den Text', ersName2 === 'Block ersetzen' && nach2.text === 'Zwei **fett** und die Lötstelle ist kalt.',
    JSON.stringify({ ersName2, ...nach2 }));
  p('§7h: … mit einer Fassung „vor KI-Änderung" davor', fassNach2 === fassVor2 + 1, JSON.stringify({ fassVor2, fassNach2 }));
  await ctx.close();
});

/* ══ §8 Verbundenes hat einen Draht ════════════════════════════════════════ */
await abschnitt('§8', async () => {
  console.log('\n§8 Verbundenes');
  const { ctx, s } = await oeffnen({ breit: 1440, hoch: 900 });
  const v = await s.evaluate(async () => {
    const w = (window as any).__g;
    const ort = w.Store.addPage(null, { text: 'Ablage 599' });
    const g = w.Store.addDatabase(ort.id, 'Mails 599', null, 'table');
    w.Store.updateCollection(g.collectionId, { gespiegelt: true, spiegelQuelle: 'github:redur/redion' });
    const zg = w.Store.addRow(g.collectionId, {});
    w.Store.updateBlock(zg.id, { text: 'Zwiebelfisch meldet sich' });
    const e = w.Store.addDatabase(ort.id, 'Eigene 599', null, 'table');
    const ze = w.Store.addRow(e.collectionId, {});
    w.Store.updateBlock(ze.id, { text: 'Quarkbrot steht im eigenen Bestand' });
    await w.Store.flush();
    w.Kontext.reparieren();
    const frage = 'Zwiebelfisch Quarkbrot';
    w.Kontext.quelleSetzen('verbindungen', true);
    const an = await w.Kontext.bauenFuerFrage(frage, { anzahl: 8 });
    w.Kontext.quelleSetzen('verbindungen', false);
    const aus = await w.Kontext.bauenFuerFrage(frage, { anzahl: 8 });
    w.Kontext.quelleSetzen('verbindungen', true);
    return { anZ: /Zwiebelfisch/.test(an.text), anQ: /Quarkbrot/.test(an.text),
      ausZ: /Zwiebelfisch/.test(aus.text), ausQ: /Quarkbrot/.test(aus.text), gleich: an.text === aus.text };
  });
  console.log('    an/aus gleich: ' + v.gleich);
  p('§8: mit „Verbundenes" an steht die gespiegelte Zeile im Kontext', v.anZ, JSON.stringify(v));
  p('§8: mit „Verbundenes" aus fehlt sie', !v.ausZ, JSON.stringify(v));
  p('§8: die eigene Datenbank bleibt in beiden Fällen drin', v.anQ && v.ausQ, JSON.stringify(v));
  const bestand = JSON.parse(fs.readFileSync(path.join(WURZEL, 'pruefungen/schalter-bestand.json'), 'utf8'));
  p('§8: q:verbindungen ist kein Schalter ohne Leser mehr (schalter-bestand.json)', !('q:verbindungen' in (bestand.ausnahmen || {})));
  await ctx.close();
});

/* ══ §9 Ehrliche Versprechen ═══════════════════════════════════════════════ */
await abschnitt('§9', async () => {
  console.log('\n§9 Ehrliche Versprechen');
  const { ctx, s } = await oeffnen({ breit: 1440, hoch: 900 });
  let nativ = 0;
  s.on('dialog', d => { nativ++; void d.dismiss(); });
  await kiAuf(s);

  /* (b) @Fähigkeit */
  let vor = rufe.length;
  await s.fill('#ai-input', '@Korrekturlesen Die Spanung ist proportinal.');
  await s.press('#ai-input', 'Enter');
  let ruf = await naechsterRuf(s, vor);
  const korrek = await auftragVon(s, 'recht');
  p('§9b: „@Korrekturlesen …" führt die Fähigkeit auf dem Rest aus', !!ruf && ruf.user === 'Die Spanung ist proportinal.' && !!korrek && ruf.system.includes(korrek),
    ruf ? JSON.stringify({ user: ruf.user, korrek }) : '(kein Ruf)');
  await s.click('#ai-clear'); await warte(s, 200);
  await s.focus('#ai-input');
  await s.keyboard.type('@');
  await warte(s, 400);
  const at = await s.evaluate(() => {
    const m = document.querySelector('.menu');
    return { menue: !!m, seiten: m?.querySelectorAll('[data-s]').length || 0, faehig: m?.querySelectorAll('[data-f]').length || 0 };
  });
  p('§9b: ein getipptes „@" öffnet die Wahl mit Seiten UND Fähigkeiten', at.menue && at.seiten > 0 && at.faehig >= 4, JSON.stringify(at));
  await s.keyboard.press('Escape'); await menueZu(s);
  await s.fill('#ai-input', '');

  /* (c) Seite erwähnen — und sie ist Kontext. */
  await s.evaluate(async () => {
    const w = (window as any).__g;
    const m = w.Store.addPage(null, { text: 'Mondkalb Notiz' });
    w.Store.addBlock(m.id, 'text', { text: 'Der Stromlaufplan liegt im Keller hinter dem Zähler.' });
    await w.Store.flush();
    w.Kontext.quelleSetzen('arbeitsbereich', false); w.Kontext.quelleSetzen('datenbanken', false);
    w.Kontext.quelleSetzen('aktuelleSeite', false);
  });
  await s.click('#ai-plus'); await warte(s, 300);
  const zeile = await s.evaluate(() => (document.querySelector('.menu [data-x="erwaehnen"]')?.textContent || '').trim());
  p('§9c: der Eintrag heisst „Seite erwähnen" — Personen gibt es nicht', /Seite erwähnen/.test(zeile) && !/Personen/.test(zeile), zeile);
  await s.evaluate(() => document.querySelector<HTMLElement>('.menu [data-x="erwaehnen"]')?.click());
  await warte(s, 400);
  await s.evaluate(() => { const b = [...document.querySelectorAll<HTMLElement>('.menu [data-s]')].find(x => /Mondkalb/.test(x.textContent || '')); b?.click(); });
  await warte(s, 200);
  await s.evaluate(() => { const t = document.getElementById('ai-input') as HTMLTextAreaElement; t.value += ' Wo liegt der Plan?'; });
  vor = rufe.length;
  await s.press('#ai-input', 'Enter');
  ruf = await naechsterRuf(s, vor);
  p('§9c: die erwähnte Seite ist Kontext der nächsten Frage', !!ruf && /hinter dem Zähler/.test(ruf.system), ruf ? ruf.system.slice(-120) : '(kein Ruf)');

  /* Eine Seite, deren Titel mit einem Befehlsnamen beginnt: die Erwähnung
     „@Zusammenfassen Woche …" ist eine Erwähnung, kein Befehl „Zusammenfassen"
     auf „Woche …" (Durchsicht 10. Oktober). */
  await s.evaluate(async () => {
    const w = (window as any).__g;
    const m = w.Store.addPage(null, { text: 'Zusammenfassen Woche' });
    w.Store.addBlock(m.id, 'text', { text: 'Der Rübenacker wird am Donnerstag gepflügt.' });
    await w.Store.flush();
  });
  await s.click('#ai-clear'); await warte(s, 250);
  await s.click('#ai-plus'); await warte(s, 300);
  await s.evaluate(() => document.querySelector<HTMLElement>('.menu [data-x="erwaehnen"]')?.click());
  await warte(s, 400);
  await s.evaluate(() => { const b = [...document.querySelectorAll<HTMLElement>('.menu [data-s]')].find(x => /Zusammenfassen Woche/.test(x.textContent || '')); b?.click(); });
  await warte(s, 200);
  await s.evaluate(() => { const t = document.getElementById('ai-input') as HTMLTextAreaElement; t.value += ' Wann wird gepflügt?'; });
  const zf = await auftragVon(s, 'zusammenfassen');
  vor = rufe.length;
  await s.press('#ai-input', 'Enter');
  ruf = await naechsterRuf(s, vor);
  p('§9c: „@Zusammenfassen Woche …" bleibt eine Erwähnung — kein Befehl, die Seite ist Kontext',
    !!ruf && /Wann wird gepflügt\?/.test(ruf.user) && /Rübenacker/.test(ruf.system) && !!zf && !ruf.system.includes(zf),
    ruf ? JSON.stringify({ user: ruf.user.slice(0, 60), befehl: !!zf && ruf.system.includes(zf) }) : '(kein Ruf)');

  /* Datenbankzeilen sind erwähnbar wie vor E724 (§17, §43). */
  await s.evaluate(async () => {
    const w = (window as any).__g;
    const ort = w.Store.addPage(null, { text: 'Garten 599' });
    const g = w.Store.addDatabase(ort.id, 'Beete 599', null, 'table');
    const z = w.Store.addRow(g.collectionId, {});
    w.Store.updateBlock(z.id, { text: 'Kohlrabizeile 599' });
    await w.Store.flush();
  });
  await s.click('#ai-plus'); await warte(s, 300);
  await s.evaluate(() => document.querySelector<HTMLElement>('.menu [data-x="erwaehnen"]')?.click());
  await warte(s, 400);
  const zeileDa = await s.evaluate(() => [...document.querySelectorAll<HTMLElement>('.menu [data-s]')].some(x => /Kohlrabizeile 599/.test(x.textContent || '')));
  p('§9c: eine Datenbankzeile steht in „Seite erwähnen" (§17: eine Zeile ist eine Seite)', zeileDa);
  await s.keyboard.press('Escape'); await menueZu(s);
  await s.fill('#ai-input', '');
  await s.evaluate(() => { const w = (window as any).__g; ['arbeitsbereich', 'datenbanken', 'aktuelleSeite'].forEach(k => w.Kontext.quelleSetzen(k, true)); });

  /* (e) Der Satz zum neuen Chat. */
  await s.evaluate(() => (window as any).__g.Kontext.quelleSetzen('aktuelleSeite', false));
  await s.click('#ai-clear'); await warte(s, 250);
  const satz = await s.evaluate(() => [...document.querySelectorAll('#chat .msg.sys')].pop()?.textContent || '');
  p('§9e: „Neuer Chat" nennt genau die aktiven Quellen', /Arbeitsbereich/.test(satz) && /Datenbanken/.test(satz) && !/offenen Seite|Diese Seite/.test(satz), satz);
  await s.evaluate(() => (window as any).__g.Kontext.quelleSetzen('aktuelleSeite', true));

  /* (d) Ein Schalter in den Einstellungen bringt das Schild am Prompt mit. */
  await s.click('#ai-quellen').catch(() => {}); await warte(s, 300);
  await s.evaluate(() => (window as any).__g.App.einstellungen('ki'));
  await warte(s, 700);
  const d = await s.evaluate(async () => {
    const w = (window as any).__g;
    const t = document.querySelector<HTMLElement>('[data-toggle="q:datenbanken"]');
    if (!t) return null;
    t.click(); await new Promise(f => setTimeout(f, 300));
    const wert = !!w.Kontext.quellen().datenbanken;
    const chips = [...document.querySelectorAll<HTMLElement>('[data-qs="datenbanken"]')].map(c => c.getAttribute('aria-pressed'));
    const schild = document.getElementById('ai-quellen')?.getAttribute('aria-label') || '';
    t.click(); await new Promise(f => setTimeout(f, 300));
    return { wert, chips, schild };
  });
  p('§9d: nach einem Schalter in den Einstellungen sagen alle Quellknöpfe dasselbe', !!d && d.chips.every(c => c === String(d.wert)), JSON.stringify(d));
  p('§9d: … und das Schild am Prompt zieht mit', !!d && /^Quellen:/.test(d.schild) && /Datenbanken/.test(d.schild) === d.wert, JSON.stringify(d));
  /* Und umgekehrt: schaltet das KI-Fenster um (sein Weg ist derselbe eine
     Schreiber), während die Einstellungen offen sind, muss ihr Schalter
     mitziehen — Klasse UND aria-checked. Sonst steht dort „an", während die
     Quelle aus ist. Hin und zurück, damit der Zustand am Ende der alte ist. */
  const d2 = await s.evaluate(async () => {
    const w = (window as any).__g;
    const t = document.querySelector<HTMLElement>('[data-toggle="q:datenbanken"]');
    if (!t) return null;
    const lies = () => ({ wert: !!w.Kontext.quellen().datenbanken,
      checked: t.getAttribute('aria-checked'), an: t.classList.contains('an') });
    await w.Kontext.quelleUmschalten('datenbanken'); await new Promise(f => setTimeout(f, 200));
    const hin = lies();
    await w.Kontext.quelleUmschalten('datenbanken'); await new Promise(f => setTimeout(f, 200));
    const zurueck = lies();
    return { hin, zurueck };
  });
  const passt = (x: { wert: boolean; checked: string | null; an: boolean }) => x.checked === String(x.wert) && x.an === x.wert;
  p('§9d: … und umgekehrt — schaltet das KI-Fenster, zieht der Schalter in den offenen Einstellungen mit (Klasse und aria-checked)',
    !!d2 && passt(d2.hin) && passt(d2.zurueck) && d2.hin.wert !== d2.zurueck.wert, JSON.stringify(d2));
  await dialogZu(s); await menueZu(s);
  await s.evaluate(() => document.querySelectorAll('.overlay').forEach(o => o.remove()));

  /* (f) Fähigkeit löschen: eigener Knopf, Tab, zwei Schritte, Escape. */
  await s.evaluate(() => (window as any).__g.KI.faehigkeitenVerwalten());
  await warte(s, 400);
  const f = await s.evaluate(() => {
    const o = [...document.querySelectorAll('.overlay')].pop();
    const knoepfe = [...(o?.querySelectorAll<HTMLElement>('[data-loeschknopf]') ?? [])];
    return { anzahl: knoepfe.length, echteKnoepfe: knoepfe.every(k => k.tagName === 'BUTTON' && !k.parentElement?.closest('button')),
      name: knoepfe[0]?.getAttribute('aria-label') || '', zahl: (window as any).__g.KI.faehigkeiten().length };
  });
  p('§9f: jede Fähigkeit hat einen eigenen Löschknopf (kein Wort im Zeilenknopf)', f.anzahl === f.zahl && f.anzahl > 0 && f.echteKnoepfe, JSON.stringify(f));
  p('§9f: … mit Namen „Fähigkeit „…" löschen"', /^Fähigkeit „.+" löschen$|^Fähigkeit „.+“ löschen$/.test(f.name), f.name);
  if (f.anzahl > 0) {
    await s.evaluate(() => [...document.querySelectorAll('.overlay')].pop()?.querySelector<HTMLElement>('[data-loeschknopf]')?.focus());
    const fokus = await s.evaluate(() => !!document.activeElement?.hasAttribute('data-loeschknopf'));
    await s.keyboard.press('Enter'); await warte(s, 500);
    const nachEins = await s.evaluate(() => (window as any).__g.KI.faehigkeiten().length);
    await s.keyboard.press('Escape'); await warte(s, 600);
    const nachEsc = await s.evaluate(() => (window as any).__g.KI.faehigkeiten().length);
    p('§9f: der Knopf ist mit Tab erreichbar, der erste Druck löscht nichts, Escape bricht ab',
      fokus && nachEins === f.zahl && nachEsc === f.zahl, JSON.stringify({ fokus, nachEins, nachEsc }));
  }
  await s.evaluate(() => document.querySelectorAll('.overlay').forEach(o => o.remove()));

  /* (g) Die Webfrage ist ein Redion-Fenster. */
  nativ = 0;
  await menueZu(s);
  await s.click('#ai-quellen').catch(() => {}); await warte(s, 300);
  await s.evaluate(() => document.querySelector<HTMLElement>('[data-qs="web"]')?.click());
  await warte(s, 900);
  const web = await s.evaluate(() => ({
    fenster: !!document.querySelector('.overlay, [data-insel-traeger]:not([data-insel-traeger="geht"])'),
    text: /verlässt/.test(document.querySelector('.overlay, [data-insel-traeger]')?.textContent || '') }));
  p('§9g: die Webfrage ist kein confirm(), sondern ein Fenster mit „verlässt"', nativ === 0 && web.fenster && web.text, JSON.stringify({ nativ, ...web }));
  await dialogZu(s);
  p('§9g: … abgelehnt bleibt das Web aus', await s.evaluate(() => !(window as any).__g.Kontext.quellen().web));
  await ctx.close();
});

/* ══ §10 Die Einzeldatei ═══════════════════════════════════════════════════ */
await abschnitt('§10', async () => {
  console.log('\n§10 Die Einzeldatei (file://)');
  const url = pathToFileURL(path.join(WURZEL, 'redion-einzeldatei.html')).href;
  const { ctx, s } = await oeffnen({ breit: 1440, hoch: 900, url });
  await kiAuf(s);
  const e = await s.evaluate(() => ({
    tools: !!document.getElementById('ai-tools'),
    quellen: !!document.querySelector('.ai-compose .ai-leiste #ai-quellen'),
    start: !!document.querySelector('#ai .ai-start #ai-db'),
    mehr: !!document.querySelector('.ai-head #ai-mehr'),
    katalog: !!((window as any).__g.Register?.ki?.alle?.()?.length > 10)
  }));
  p('§10: die Einzeldatei trägt dasselbe (kein Kasten, Quellen am Prompt, leerer Chat, ⋯, Katalog)',
    !e.tools && e.quellen && e.start && e.mehr && e.katalog, JSON.stringify(e));
  await ctx.close();
});

/* ══ §11 Ruhe ══════════════════════════════════════════════════════════════ */
await abschnitt('§11', async () => {
  console.log('\n§11 Ruhe');
  for (const art of ['reduce', 'ruhig'] as const) {
    const { ctx, s } = await oeffnen({ breit: 1440, hoch: 900, ruhig: art === 'reduce' });
    if (art === 'ruhig') await s.evaluate(() => { document.body.dataset.bewegung = 'ruhig'; });
    await kiAuf(s);
    const laeuft: string[] = [];
    for (const knopf of ['#ai-quellen', '#ai-mehr']) {
      if (!await s.evaluate((q: string) => !!document.querySelector(q), knopf)) { laeuft.push(knopf + ' fehlt'); continue; }
      await s.click(knopf); await warte(s, 120);
      laeuft.push(...await s.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' &&
        (a.effect as KeyframeEffect | null)?.target instanceof Element &&
        ((a.effect as KeyframeEffect).target as Element).closest('#ai, .menu, .ru-tropfen-buehne') &&
        ((a.effect as KeyframeEffect).getComputedTiming().activeDuration as number) > 0)
        .map(a => ((a.effect as KeyframeEffect).target as Element).className.toString().slice(0, 30))));
      await menueZu(s);
    }
    p(`§11 ${art}: nach einer Zehntelsekunde läuft im Blatt und seinen Menüs nichts mehr`, laeuft.length === 0, laeuft.join(' | '));
    await ctx.close();
  }
});

p('Keine Laufzeitfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));
await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
