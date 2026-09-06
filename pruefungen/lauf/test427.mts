/* Suite 427 — Zustand, Zustandsknopf und die Weiter-Variante (E441)
 * ============================================================================
 * BEFUND. Eine Sicherung mit Anhaengen dauert Sekunden bis Minuten. In
 * den Einstellungen zeigte in dieser Zeit NICHTS an, dass etwas laeuft:
 * ein gewoehnlicher Knopf „Speichern", irgendwann ein Toast. Der
 * Start-Bildschirm hatte dafuer eine eigene Loesung (E57), und jede
 * weitere Stelle haette sich wieder eine gebaut. Dazu hatte jede Stelle
 * eigene Woerter fuer „laeuft, fertig, Fehler".
 *
 * Jetzt gibt es EINE Sprache (`zustand.ts`) und EINEN Knopf
 * (`zustandsknopf.ts`), der die Aktion ausloest, sich waehrenddessen
 * sperrt und seinen Verlauf sichtbar und hoerbar sagt. Der Zustand kommt
 * aus der Zusage der echten Arbeit — nie aus einem Zeitgeber.
 *
 *   §1 DIE PILLE: Rolle, data-zustand, Zeichen UND Text, Wechsel.
 *   §2 DER KNOPF: Klick → arbeitet (aria-busy); zweiter Klick zaehlt
 *      nicht; fertig → bereit nach `fertigNach`; Fehler zeigt Text und
 *      laesst es noch einmal versuchen; `false` ist ein Fehlschlag; der
 *      Oeffnen-Weg.
 *   §3 DIE TASTATUR: Enter und Leertaste loesen aus; der Fokus ist sichtbar.
 *   §4 DIE WEITER-VARIANTE an einer echten Stelle: Pfeil da, gleitet beim
 *      Ueberfahren — und steht still, wenn keine Bewegung gewuenscht ist.
 *   §5 DIE SICHERUNG: der neue Knopf steht in den Einstellungen, ein
 *      Klick laedt wirklich herunter (Playwright faengt das Ereignis), und
 *      der Zustand geht durch arbeitet → fertig. Die HTML-Einzeldatei
 *      geht weiter bis „Oeffnen" und oeffnet ein Fenster.
 *   §6 MASS UND KONTRAST: 44 px auf dem Hauptweg; im Dunkelmodus lesbar.
 *   §7 KEIN KONSOLENFEHLER beim Laden.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §2 → in `zustandsknopf.ts` die Zeile `if (jetzt === 'arbeitet') return;`
 *        im Klickgriff entfernen: der zweite Klick startet eine zweite
 *        Aktion, „zaehlt nicht" wird rot.
 *   §2 → `aria-busy` nicht setzen: „sagt aria-busy" wird rot.
 *   §4 → in werkzeuge.css den `prefers-reduced-motion`-Block der
 *        Weiter-Variante entfernen: der Pfeil gleitet trotzdem (grund.css
 *        kuerzt nur die Dauer), „steht still" wird rot.
 * Alle drei gelaufen, Ergebnisse im Bericht zu E441.
 *
 *   node pruefungen/lauf/test427.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9548;

const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => { server.listen(PORT, () => f()); });

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

/* Ein Prüflauf ohne Stellvertreter: die echte App, die echten Skripte.
   Was hier in die Seite gehängt wird, hängt in einer leeren Fläche —
   geprüft wird das Bauteil, nicht sein erster Benutzer (§1–§3). Die
   echten Stellen kommen in §4 und §5. */
const AUFRAEUMEN = `(() => {
  document.querySelectorAll('.overlay, .menu, .menu-grund, #r-blatt, #rg-willkommen, ' +
    '#rg-einladung, .produkt-onboarding-lage').forEach(x => x.remove());
  Store.setMeta('rundgangGesehen', true);
})()`;

const browser = await chromium.launch();
const fehler: string[] = [];
const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
s.on('console', m => { if (m.type() === 'error') fehler.push('console: ' + m.text().slice(0, 140)); });
await s.goto(`http://localhost:${PORT}/index.html`);
await s.waitForFunction("typeof App !== 'undefined' && typeof Zustand !== 'undefined' " +
                        "&& typeof Zustandsknopf !== 'undefined' && typeof Einstellungen !== 'undefined'",
                        null, { timeout: 30000 });
await s.waitForTimeout(600);
await s.evaluate(AUFRAEUMEN);

await s.evaluate(`(() => {
  const platz = document.createElement('div');
  platz.id = 'zk-probe';
  platz.style.cssText = 'position:fixed;left:20px;top:80px;z-index:9000;display:flex;gap:12px;align-items:center';
  document.body.append(platz);
})()`);

console.log('\n§1 Die Pille: Rolle, Zeichen und Text, und der Wechsel');
const pille = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const platz = document.getElementById('zk-probe');
  const el = Zustand.pille({ art: 'laeuft' });
  platz.append(el);
  const z = el.querySelector('.ru-zustand-zeichen');
  const t = el.querySelector('.ru-zustand-text');
  const vorher = { rolle: el.getAttribute('role'), art: el.dataset.zustand,
    zeichen: z ? z.textContent : '', text: t ? t.textContent : '',
    zeichenVersteckt: z ? z.getAttribute('aria-hidden') : '',
    dreht: z ? getComputedStyle(z).animationName : '' };
  Zustand.setzen(el, 'fertig', 'Sicherung geschrieben');
  const nachher = { art: el.dataset.zustand, zeichen: z ? z.textContent : '',
    text: t ? t.textContent : '', farbeAnders: getComputedStyle(el).color !== '' ,
    dreht: z ? getComputedStyle(z).animationName : '' };
  Zustand.setzen(el, 'fehler');
  const fehler = { zeichen: z ? z.textContent : '', text: t ? t.textContent : '' };
  return { vorher, nachher, fehler, arten: Object.keys(Zustand.ARTEN) };
})())`) as string);
p('Die Pille ist eine Statusregion', pille.vorher.rolle === 'status', JSON.stringify(pille.vorher));
p('… trägt ihre Art als data-zustand', pille.vorher.art === 'laeuft');
p('… und sagt sie mit Zeichen UND Text (§38)',
  pille.vorher.zeichen === '◐' && pille.vorher.text === 'Läuft …', JSON.stringify(pille.vorher));
p('Das Zeichen ist für den Vorleser unsichtbar — der Text reicht',
  pille.vorher.zeichenVersteckt === 'true');
p('Solange es läuft, dreht sich das Zeichen', pille.vorher.dreht === 'ru-dreh', pille.vorher.dreht);
p('Umschalten wechselt Art, Zeichen und Text',
  pille.nachher.art === 'fertig' && pille.nachher.zeichen === '✓' &&
  pille.nachher.text === 'Sicherung geschrieben', JSON.stringify(pille.nachher));
p('… und die Drehung hört auf', pille.nachher.dreht === 'none', pille.nachher.dreht);
p('Ohne eigenen Text steht der Standardsatz der Art',
  pille.fehler.zeichen === '!' && pille.fehler.text === 'Fehler', JSON.stringify(pille.fehler));
p('Die drei gespeicherten Werte der Dateiablage sind dabei — unverändert',
  ['wartet', 'laeuft', 'fertig'].every(a => pille.arten.includes(a)), pille.arten.join(','));

console.log('\n§2 Der Zustandsknopf: Sperre, Rückkehr, Fehler, Öffnen');
/* Eine Aktion, die erst fertig ist, wenn der Prüflauf es sagt. So lässt
   sich der mittlere Zustand ANSEHEN statt erraten. */
await s.evaluate(`(() => {
  window.__aufrufe = 0;
  window.__frei = null;
  window.__griff = Zustandsknopf.bauen({
    texte: { bereit: 'Sichern', arbeitet: 'Wird erstellt …', fertig: 'Gesichert' },
    art: 'laden', fertigNach: 400,
    aktion: () => { window.__aufrufe++; return new Promise((f, r) => { window.__frei = { f, r }; }); }
  });
  window.__griff.element.id = 'zk-eins';
  document.getElementById('zk-probe').append(window.__griff.element);
})()`);
const ruhe = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const k = document.getElementById('zk-eins');
  return { tag: k.tagName, typ: k.type, art: k.dataset.art, zustand: k.dataset.zustand,
    busy: k.getAttribute('aria-busy'), text: k.querySelector('.ru-zk-text').textContent,
    zeichen: k.querySelector('.ru-zk-zeichen').textContent,
    live: k.querySelector('.ru-zk-text').getAttribute('aria-live'),
    balken: getComputedStyle(k.querySelector('.ru-zk-balken')).display };
})())`) as string);
p('Ein echter <button type="button">', ruhe.tag === 'BUTTON' && ruhe.typ === 'button', JSON.stringify(ruhe));
p('Bereit: data-zustand, Text aus dem Auftrag, Pfeil der Sicht „laden"',
  ruhe.zustand === 'bereit' && ruhe.text === 'Sichern' && ruhe.zeichen === '↓' && ruhe.art === 'laden',
  JSON.stringify(ruhe));
p('Der Text ist eine höfliche Live-Region', ruhe.live === 'polite');
p('Der Balken ist in Ruhe aus', ruhe.balken === 'none', ruhe.balken);

await s.click('#zk-eins');
await s.waitForTimeout(80);
const laeuft = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const k = document.getElementById('zk-eins');
  return { zustand: k.dataset.zustand, busy: k.getAttribute('aria-busy'),
    text: k.querySelector('.ru-zk-text').textContent, zeichen: k.querySelector('.ru-zk-zeichen').textContent,
    dreht: getComputedStyle(k.querySelector('.ru-zk-zeichen')).animationName,
    balken: getComputedStyle(k.querySelector('.ru-zk-balken')).display,
    gleitet: getComputedStyle(k.querySelector('.ru-zk-balken i')).animationName,
    disabled: k.disabled, aufrufe: window.__aufrufe, griff: window.__griff.zustand() };
})())`) as string);
p('Klick → arbeitet, und der Griff sagt es auch',
  laeuft.zustand === 'arbeitet' && laeuft.griff === 'arbeitet' && laeuft.aufrufe === 1, JSON.stringify(laeuft));
p('… sagt aria-busy', laeuft.busy === 'true', String(laeuft.busy));
p('… wechselt den Text SICHTBAR', laeuft.text === 'Wird erstellt …', laeuft.text);
p('… mit dem Zeichen aus Zustand, das sich dreht',
  laeuft.zeichen === '◐' && laeuft.dreht === 'ru-dreh', JSON.stringify(laeuft));
p('… und der Balken läuft unbestimmt, weil kein Anteil bekannt ist',
  laeuft.balken === 'block' && laeuft.gleitet === 'ru-zk-gleiten', JSON.stringify(laeuft));
p('Der Knopf ist dabei nicht gesperrt — er behält den Fokus', laeuft.disabled === false);
/* DIE SPERRE. Ein zweiter Klick während der Arbeit wäre eine zweite
   Sicherung — bei Anhängen eine zweite Runde durch alle Dateien. */
await s.click('#zk-eins');
await s.click('#zk-eins');
await s.waitForTimeout(60);
p('Zwei weitere Klicks während der Arbeit zählen nicht',
  await s.evaluate('window.__aufrufe') === 1, String(await s.evaluate('window.__aufrufe')) + ' Aufrufe');
/* Ein Fortschritt von aussen: Text und Anteil. */
const fortschritt = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  window.__griff.setzen('arbeitet', '3 von 7 Anhängen', 3 / 7);
  const k = document.getElementById('zk-eins');
  const b = k.querySelector('.ru-zk-balken');
  return { text: k.querySelector('.ru-zk-text').textContent, bestimmt: b.classList.contains('bestimmt'),
    anteil: b.style.getPropertyValue('--ru-zk-anteil'),
    gleitet: getComputedStyle(b.querySelector('i')).animationName };
})())`) as string);
p('Von aussen getrieben: Fortschrittstext und bestimmter Balken',
  fortschritt.text === '3 von 7 Anhängen' && fortschritt.bestimmt && /^42\.9%$/.test(fortschritt.anteil) &&
  fortschritt.gleitet === 'none', JSON.stringify(fortschritt));

await s.evaluate(`window.__frei.f(true)`);
await s.waitForTimeout(80);
const fertig = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const k = document.getElementById('zk-eins');
  return { zustand: k.dataset.zustand, busy: k.getAttribute('aria-busy'),
    text: k.querySelector('.ru-zk-text').textContent, zeichen: k.querySelector('.ru-zk-zeichen').textContent };
})())`) as string);
p('Die Zusage ist eingelöst → fertig, mit Haken und Text',
  fertig.zustand === 'fertig' && fertig.busy === 'false' && fertig.text === 'Gesichert' && fertig.zeichen === '✓',
  JSON.stringify(fertig));
await s.waitForTimeout(520);
const zurueck = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const k = document.getElementById('zk-eins');
  return { zustand: k.dataset.zustand, text: k.querySelector('.ru-zk-text').textContent };
})())`) as string);
p('Nach fertigNach fällt er zurück auf bereit',
  zurueck.zustand === 'bereit' && zurueck.text === 'Sichern', JSON.stringify(zurueck));

/* Der Fehlschlag: die Zusage platzt. */
await s.click('#zk-eins');
await s.waitForTimeout(40);
await s.evaluate(`window.__frei.r(new Error('Der Speicher ist voll.\\nZweite Zeile, die keiner sieht.'))`);
await s.waitForTimeout(80);
const kaputt = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const k = document.getElementById('zk-eins');
  return { zustand: k.dataset.zustand, text: k.querySelector('.ru-zk-text').textContent,
    zeichen: k.querySelector('.ru-zk-zeichen').textContent, aufrufe: window.__aufrufe };
})())`) as string);
p('Eine geplatzte Zusage → fehler, mit der Meldung des Fehlers (erste Zeile)',
  kaputt.zustand === 'fehler' && kaputt.text === 'Der Speicher ist voll.' && kaputt.zeichen === '!',
  JSON.stringify(kaputt));
await s.click('#zk-eins');
await s.waitForTimeout(40);
p('Ein Klick im Fehler versucht es noch einmal',
  await s.evaluate('window.__aufrufe') === 3 && await s.evaluate('window.__griff.zustand()') === 'arbeitet');
/* `false` als Ergebnis zählt als Fehlschlag — so hält es
   `App.sicherungSpeichern`, das seine Fehler selbst fängt (E146). */
await s.evaluate(`window.__frei.f(false)`);
await s.waitForTimeout(80);
p('Ein ausdrückliches `false` ist ein Fehlschlag, kein Erfolg',
  await s.evaluate('window.__griff.zustand()') === 'fehler');
await s.evaluate(`window.__griff.setzen('bereit')`);

/* Der Öffnen-Weg: Bestätigung, dann Aufforderung, dann ein Klick, der
   `oeffnen` ruft — und nicht die Aktion. */
await s.evaluate(`(() => {
  window.__geoeffnet = 0; window.__aufrufe2 = 0;
  window.__griff2 = Zustandsknopf.bauen({
    texte: { bereit: 'Erzeugen', arbeitet: 'Wird erzeugt …', geschafft: 'Heruntergeladen', fertig: 'Öffnen' },
    art: 'laden',
    aktion: () => { window.__aufrufe2++; return Promise.resolve(); },
    oeffnen: () => { window.__geoeffnet++; }
  });
  window.__griff2.element.id = 'zk-zwei';
  document.getElementById('zk-probe').append(window.__griff2.element);
})()`);
await s.click('#zk-zwei');
await s.waitForTimeout(100);
const bestaetigung = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const k = document.getElementById('zk-zwei');
  return { zustand: k.dataset.zustand, text: k.querySelector('.ru-zk-text').textContent,
    zeichen: k.querySelector('.ru-zk-zeichen').textContent };
})())`) as string);
p('Mit `oeffnen`: erst die Bestätigung „Heruntergeladen" mit Haken',
  bestaetigung.zustand === 'fertig' && bestaetigung.text === 'Heruntergeladen' && bestaetigung.zeichen === '✓',
  JSON.stringify(bestaetigung));
await s.waitForTimeout(1350);
const aufforderung = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const k = document.getElementById('zk-zwei');
  return { zustand: k.dataset.zustand, text: k.querySelector('.ru-zk-text').textContent,
    klasse: k.className };
})())`) as string);
p('… dann die Aufforderung „Öffnen" — und sie bleibt stehen',
  aufforderung.zustand === 'fertig' && aufforderung.text === 'Öffnen' && /ru-zk-aufforderung/.test(aufforderung.klasse),
  JSON.stringify(aufforderung));
await s.click('#zk-zwei');
await s.waitForTimeout(60);
const geoeffnet = JSON.parse(await s.evaluate(`JSON.stringify({ geoeffnet: window.__geoeffnet,
  aufrufe: window.__aufrufe2, zustand: window.__griff2.zustand() })`) as string);
p('Ein Klick ruft `oeffnen` — nicht noch einmal die Aktion — und kehrt auf bereit zurück',
  geoeffnet.geoeffnet === 1 && geoeffnet.aufrufe === 1 && geoeffnet.zustand === 'bereit', JSON.stringify(geoeffnet));

console.log('\n§3 Die Tastatur löst aus, und der Fokus ist zu sehen');
await s.evaluate(`(() => {
  const vor = document.createElement('button'); vor.id = 'zk-vor'; vor.textContent = 'davor';
  document.getElementById('zk-probe').prepend(vor);
  vor.focus();
  window.__aufrufe = 0;
})()`);
await s.keyboard.press('Tab');
await s.waitForTimeout(40);
const fokus = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const k = document.getElementById('zk-eins');
  const c = getComputedStyle(k);
  return { aktiv: document.activeElement === k, outlineStil: c.outlineStyle, outlineBreite: c.outlineWidth,
    schatten: c.boxShadow };
})())`) as string);
p('Tab landet auf dem Knopf', fokus.aktiv === true, JSON.stringify(fokus));
p('… und der Fokus ist sichtbar (§38)',
  (fokus.outlineStil !== 'none' && parseFloat(fokus.outlineBreite) >= 1) || fokus.schatten !== 'none',
  JSON.stringify(fokus));
await s.keyboard.press('Enter');
await s.waitForTimeout(40);
p('Enter löst aus', await s.evaluate('window.__aufrufe') === 1 && await s.evaluate('window.__griff.zustand()') === 'arbeitet');
await s.evaluate(`window.__frei.f(true); window.__griff.setzen('bereit')`);
await s.waitForTimeout(40);
await s.keyboard.press('Space');
await s.waitForTimeout(40);
p('Die Leertaste auch', await s.evaluate('window.__aufrufe') === 2);
await s.evaluate(`window.__frei.f(true); window.__griff.setzen('bereit')`);

console.log('\n§4 Die Weiter-Variante an einer echten Stelle');
await s.evaluate(`Einstellungen.oeffne('verbindungen')`);
await s.waitForTimeout(300);
const weiter = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const k = document.querySelector('.overlay .ez-knopf.weiter[data-tun="kalender-verb"]');
  if (!k) return { fehlt: true };
  const n = getComputedStyle(k, '::after');
  return { text: k.textContent.trim(), pfeil: n.content, transformRuhe: n.transform,
    anzahl: document.querySelectorAll('.overlay .ez-knopf.weiter').length };
})())`) as string);
p('„Öffnen" in den Verbindungen trägt die Variante — und zwar mehrfach',
  !weiter.fehlt && weiter.text === 'Öffnen' && weiter.anzahl >= 3, JSON.stringify(weiter));
p('Der Pfeil ist da (::after) und steht in Ruhe still',
  /→/.test(weiter.pfeil) && (weiter.transformRuhe === 'none'), JSON.stringify(weiter));
await s.hover('.overlay .ez-knopf.weiter[data-tun="kalender-verb"]');
await s.waitForTimeout(250);
const gleitet = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const k = document.querySelector('.overlay .ez-knopf.weiter[data-tun="kalender-verb"]');
  const n = getComputedStyle(k, '::after');
  const v = getComputedStyle(k, '::before');
  return { transform: n.transform, schimmer: v.animationName, hoehe: Math.round(k.getBoundingClientRect().height) };
})())`) as string);
p('Beim Überfahren gleitet der Pfeil nach rechts',
  /matrix\(1, 0, 0, 1, 4, 0\)/.test(gleitet.transform), gleitet.transform);
p('… und der Schimmer zieht einmal durch', gleitet.schimmer === 'btn-schimmer', gleitet.schimmer);
/* OHNE BEWEGUNG. grund.css kürzt nur die Dauer — ein Sprung um vier
   Pixel bliebe. Die Variante muss den Pfeil wirklich stehen lassen. */
const ruhig = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
ruhig.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
await ruhig.goto(`http://localhost:${PORT}/index.html`);
await ruhig.waitForFunction("typeof App !== 'undefined' && typeof Zustandsknopf !== 'undefined' " +
                            "&& typeof Einstellungen !== 'undefined'", null, { timeout: 30000 });
await ruhig.waitForTimeout(600);
await ruhig.evaluate(AUFRAEUMEN);
await ruhig.evaluate(`Einstellungen.oeffne('verbindungen')`);
await ruhig.waitForTimeout(300);
await ruhig.hover('.overlay .ez-knopf.weiter[data-tun="kalender-verb"]');
await ruhig.waitForTimeout(250);
const still = JSON.parse(await ruhig.evaluate(`JSON.stringify((() => {
  const k = document.querySelector('.overlay .ez-knopf.weiter[data-tun="kalender-verb"]');
  const n = getComputedStyle(k, '::after');
  const v = getComputedStyle(k, '::before');
  const g = document.createElement('div'); document.body.append(g);
  const griff = Zustandsknopf.bauen({ texte: { bereit: 'a', arbeitet: 'b' }, art: 'laden',
    aktion: () => new Promise(() => {}) });
  g.append(griff.element); griff.element.click();
  const dreht = getComputedStyle(griff.element.querySelector('.ru-zk-zeichen')).animationName;
  const balken = getComputedStyle(griff.element.querySelector('.ru-zk-balken i')).animationName;
  g.remove();
  return { pfeil: n.content, transform: n.transform, schimmer: v.animationName, dreht, balken,
    reduziert: matchMedia('(prefers-reduced-motion: reduce)').matches };
})())`) as string);
p('Ohne Bewegungswunsch: der Pfeil ist da, steht aber still',
  still.reduziert && /→/.test(still.pfeil) && still.transform === 'none', JSON.stringify(still));
p('… und kein Schimmer', still.schimmer === 'none', still.schimmer);
p('… auch der Zustandsknopf dreht und gleitet dann nicht',
  still.dreht === 'none' && still.balken === 'none', JSON.stringify(still));
await ruhig.close();

console.log('\n§5 Die Sicherung: der Knopf steht, lädt wirklich herunter, geht durch die Zustände');
await s.evaluate(`Einstellungen.oeffne('daten')`);
await s.waitForTimeout(300);
const sicherung = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const k = document.querySelector('.overlay button[data-zk="export-json"]');
  if (!k) return { fehlt: true };
  const alt = document.querySelector('.overlay [data-tun="export-json"]');
  return { tag: k.tagName, art: k.dataset.art, zustand: k.dataset.zustand,
    text: k.querySelector('.ru-zk-text').textContent, zeichen: k.querySelector('.ru-zk-zeichen').textContent,
    klasse: k.className, alterKnopfWeg: !alt, hoehe: Math.round(k.getBoundingClientRect().height) };
})())`) as string);
p('„Sicherung speichern" ist jetzt ein Zustandsknopf der Sicht „laden"',
  !sicherung.fehlt && sicherung.tag === 'BUTTON' && sicherung.art === 'laden' && sicherung.zustand === 'bereit',
  JSON.stringify(sicherung));
p('… mit dem alten Wort „Speichern" und dem Pfeil nach unten',
  sicherung.text === 'Speichern' && sicherung.zeichen === '↓', JSON.stringify(sicherung));
p('… in der Knopffamilie der Einstellungen, und der alte Knopf ist fort',
  /ez-knopf/.test(sicherung.klasse) && sicherung.alterKnopfWeg === true, sicherung.klasse);
/* Ein Beobachter schreibt jeden Zustandswechsel mit — die JSON-Sicherung
   ist schnell, und „arbeitet" wäre sonst vorbei, bevor jemand hinsieht. */
await s.evaluate(`(() => {
  const k = document.querySelector('.overlay button[data-zk="export-json"]');
  window.__verlauf = [];
  new MutationObserver(() => window.__verlauf.push(k.dataset.zustand + '/' + k.getAttribute('aria-busy') + '/' +
    k.querySelector('.ru-zk-text').textContent))
    .observe(k, { attributes: true, attributeFilter: ['data-zustand', 'aria-busy'] });
})()`);
const [download] = await Promise.all([
  s.waitForEvent('download', { timeout: 15000 }),
  s.click('.overlay button[data-zk="export-json"]')
]);
await s.waitForTimeout(400);
const name = download.suggestedFilename();
p('Ein Klick lädt WIRKLICH eine Sicherung herunter (Playwright fängt das Ereignis)',
  /^redion-sicherung-\d{4}-\d{2}-\d{2}\.(json|redion)$/.test(name), name);
const verlauf = JSON.parse(await s.evaluate(`JSON.stringify({ verlauf: window.__verlauf,
  jetzt: document.querySelector('.overlay button[data-zk="export-json"]').dataset.zustand,
  text: document.querySelector('.overlay button[data-zk="export-json"] .ru-zk-text').textContent })`) as string);
p('Der Zustand ging durch arbeitet (aria-busy, „Wird erstellt …") …',
  verlauf.verlauf.some((v: string) => /^arbeitet\/true\/Wird erstellt …$/.test(v)), JSON.stringify(verlauf.verlauf));
p('… und steht jetzt auf fertig: „Heruntergeladen" — ohne „Öffnen", denn .json kann der Browser nicht zeigen',
  verlauf.jetzt === 'fertig' && verlauf.text === 'Heruntergeladen', JSON.stringify(verlauf));
/* Die HTML-Einzeldatei geht weiter: sie kann der Browser öffnen. */
const [download2] = await Promise.all([
  s.waitForEvent('download', { timeout: 15000 }),
  s.click('.overlay button[data-zk="einzeldatei"]')
]);
p('Die HTML-Einzeldatei lädt ebenso herunter', /^notizen-archiv-.*\.html$/.test(download2.suggestedFilename()),
  download2.suggestedFilename());
await s.waitForTimeout(1500);
const einzel = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const k = document.querySelector('.overlay button[data-zk="einzeldatei"]');
  return { zustand: k.dataset.zustand, text: k.querySelector('.ru-zk-text').textContent };
})())`) as string);
p('… und bietet danach „Öffnen" an', einzel.zustand === 'fertig' && einzel.text === 'Öffnen', JSON.stringify(einzel));
const [fenster] = await Promise.all([
  s.waitForEvent('popup', { timeout: 15000 }),
  s.click('.overlay button[data-zk="einzeldatei"]')
]);
await fenster.waitForLoadState('domcontentloaded');
const titel = await fenster.title();
p('„Öffnen" öffnet die Datei wirklich in einem Fenster', /Redion/.test(titel), titel);
await fenster.close();
p('… und der Knopf steht wieder auf bereit',
  await s.evaluate(`document.querySelector('.overlay button[data-zk="einzeldatei"]').dataset.zustand`) === 'bereit');

console.log('\n§6 Mass und Kontrast');
p('Der Sicherungsknopf misst 44 px — ein Hauptweg (§37)', sicherung.hoehe >= 44, sicherung.hoehe + ' px');
/* „Öffnen" gehört zur Knopffamilie der Einstellungen, die am Rechner 34 px
   misst und AM TELEFON 44 (einstellungen.css, E58). §37 ist eine Regel
   für Finger — gemessen wird deshalb dort, wo Finger sind. */
const handy = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
handy.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
await handy.goto(`http://localhost:${PORT}/index.html`);
await handy.waitForFunction("typeof App !== 'undefined' && typeof Zustandsknopf !== 'undefined' " +
                            "&& typeof Einstellungen !== 'undefined'", null, { timeout: 30000 });
await handy.waitForTimeout(600);
await handy.evaluate(AUFRAEUMEN);
await handy.evaluate(`Einstellungen.oeffne('verbindungen')`);
await handy.waitForTimeout(300);
const amTelefon = JSON.parse(await handy.evaluate(`JSON.stringify((() => {
  document.querySelector('.einst-fenster')?.setAttribute('data-blick', 'bereich');
  const oeffnen = document.querySelector('.overlay .ez-knopf.weiter[data-tun="kalender-verb"]');
  /* Erst messen, dann die Seite wechseln — oeffne() ersetzt das Overlay,
     und ein abgehängtes Element misst 0. */
  const oeffnenHoehe = oeffnen ? Math.round(oeffnen.getBoundingClientRect().height) : 0;
  Einstellungen.oeffne('daten');
  document.querySelector('.einst-fenster')?.setAttribute('data-blick', 'bereich');
  const sichern = document.querySelector('.overlay button[data-zk="export-json"]');
  return { oeffnen: oeffnenHoehe,
    sichern: sichern ? Math.round(sichern.getBoundingClientRect().height) : 0,
    breite: sichern ? Math.round(sichern.getBoundingClientRect().right) : 0, fenster: innerWidth };
})())`) as string);
p('„Öffnen" in den Verbindungen misst am Telefon 44 px', amTelefon.oeffnen >= 44, amTelefon.oeffnen + ' px');
p('Der Sicherungsknopf am Telefon ebenso — und ragt nicht aus dem Bild',
  amTelefon.sichern >= 44 && amTelefon.breite <= amTelefon.fenster, JSON.stringify(amTelefon));
await handy.close();
/* Kontrast grob: Textfarbe gegen den ersten undurchsichtigen Grund
   darunter, nach WCAG. Vier Zustände, hell und dunkel. */
const kontrast = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const lese = (c) => { const m = c.match(/[\\d.]+/g) || []; return m.slice(0, 4).map(Number); };
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const lum = (rgb) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
  const grund = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const c = lese(getComputedStyle(e).backgroundColor);
      if (c.length >= 3 && (c[3] === undefined || c[3] > 0.9)) return c;
    }
    return [255, 255, 255];
  };
  const k = document.querySelector('.overlay button[data-zk="export-json"]');
  const aus = {};
  for (const thema of ['light', 'dark']) {
    document.documentElement.dataset.theme = thema;
    for (const z of ['bereit', 'arbeitet', 'fertig', 'fehler']) {
      k.dataset.zustand = z;
      const t = lese(getComputedStyle(k).color), g = grund(k);
      const l1 = lum(t), l2 = lum(g);
      aus[thema + '/' + z] = Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 10) / 10;
    }
  }
  k.dataset.zustand = 'bereit';
  document.documentElement.dataset.theme = Store.getMeta('theme', 'dark');
  return aus;
})())`) as string);
const schwach = Object.entries(kontrast).filter(([, v]) => (v as number) < 4.5);
p('Der Text ist in jedem Zustand lesbar, hell und dunkel (≥ 4,5:1)',
  schwach.length === 0, JSON.stringify(kontrast));

console.log('\n§7 Keine Fehler beim Laden');
p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
