/* Suite 436 — Sichtbar und lustig: sieben Bauteile an den Wegen, die man täglich geht (E463)
 * ============================================================================
 * Redur, 6. September: „nicht einfach Orte, die man nicht sieht — es muss
 * sichtbar sein" und „du musst alles stark nutzen, die Webseite könnte auch
 * lustig sein". Diese Suite hält fest, dass die Bauteile WIRKLICH an den
 * sichtbaren Stellen stehen — und dass sie dort nichts behaupten, was nicht
 * stimmt.
 *
 *   §1 DER VORHANG: steht vor dem ersten Skript, nimmt keine Klicks an,
 *      und ist nach dem Start weg. Die Notbremse im Stilblatt gibt es.
 *   §2 DIE STERNE im Studio-Kopf: nur mit laufendem Auftrag, mit echter
 *      Zahl und echtem Vorlesenamen; ein Druck öffnet das Auftragsfenster.
 *   §3 DIE PRESSE beim PDF-Einlesen: eine schwebende Karte mit
 *      `role="status"`, die auf jedem Weg hinaus wieder verschwindet — und
 *      kein Toast daneben, sonst hört der Vorleser alles zweimal.
 *   §4 DIE HAND im Rundgang: am echten Ziel, wandert mit, steht unter dem
 *      Kasten, ist nach dem Rundgang weg.
 *   §5 DER FUNKEL-KNOPF: „Datenbank bauen", „Seite aufbauen", „Lernen
 *      starten" sind dunkel, die Buchstaben einzeln — und der Text ist noch
 *      derselbe; ein Klick auf einen Buchstaben trifft den Knopf.
 *   §6 DAS RAUSCHEN ALS COVER: drei Kacheln in der Wahl, zwei Lagen auf der
 *      Seite, EIN Filterhalter — und der alte Fehler, dass `conic-gradient`
 *      als Bildadresse gelesen wurde, ist weg.
 *   §7 KEIN AUGE MEHR am Ordnerdeckel (E608, war E463). Redur am
 *      16. September: „mach die Augen weg und behalte nur so: wenn ich mit
 *      Maus drauf gehe, sollte sie mir zeigen, oder mit Laptop-Stift."
 *      Geprüft wird deshalb dreierlei: das Auge ist WEG, der Blick kommt
 *      vom Deckel (Maus UND Stift), und der Weg mit dem Finger ist nicht
 *      verlorengegangen — „Blick hinein" steht weiter im ⌄-Menü (§37).
 *   §8 OHNE BEWEGUNG steht alles still.
 *   §9 Eingebunden (index.html, GRUNDSTOCK, TypeScript-Quelle).
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → in `schale.ts` den Ruf `vorhangWeg()` nach `starteWirklich()`
 *        weglassen: der Vorhang bleibt 6 s stehen, „nach dem Start weg" rot.
 *        Gelaufen am 6. September 2026, rot.
 *   §4 → in `rundgang.ts` `Geste.weg()` aus `aufraeumen` nehmen: die Hand
 *        bleibt nach „Fertig" stehen. Gelaufen, rot.
 *   §7 → in `bibliothek.ts` die Verdrahtung am Ordnerdeckel weglassen: das
 *        Hinschauen öffnet keine Karte. Gelaufen am 16. September, rot.
 *        (Vorher lautete diese Zeile „die Verdrahtung der `.bib-blick`
 *        weglassen" — das Auge gibt es seit E608 nicht mehr.)
 *
 *   node pruefungen/lauf/test436.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9556;
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
const lies = (f: string): string => fs.readFileSync(path.join(WURZEL, f), 'utf8');
const warte = (ms: number) => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch();
const fehler: string[] = [];
const seite = async (opt: { breite?: number; ruhig?: boolean; beruehrung?: boolean } = {}) => {
  const s = await browser.newPage({
    viewport: { width: opt.breite ?? 1280, height: 900 },
    ...(opt.ruhig ? { reducedMotion: 'reduce' as const } : {}),
    ...(opt.beruehrung ? { hasTouch: true, isMobile: true } : {})
  });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  s.on('console', m => {
    /* Das KI-Fenster (§5) fragt beim Öffnen den lokalen Ollama-Dienst an;
       im Prüflauf gibt es keinen, und der Browser meldet das als
       Ladefehler. Das ist die Abwesenheit eines Servers, kein Fehler
       dieser Suite (§22). */
    if (m.type() === 'error' && !/ERR_CONNECTION_REFUSED/.test(m.text()))
      fehler.push('console: ' + m.text().slice(0, 140));
  });
  await s.goto(`http://localhost:${PORT}/index.html`);
  return s;
};
const oeffne = async (opt: { breite?: number; ruhig?: boolean; beruehrung?: boolean } = {}) => {
  const s = await seite(opt);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Geste !== 'undefined' " +
                          "&& typeof Funkel !== 'undefined' && typeof Lader !== 'undefined' " +
                          "&& typeof Rundgang !== 'undefined' && document.querySelector('#page')");
  await s.evaluate(`(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
  })()`);
  return s;
};

/* ═══ §1 Der Vorhang ═══════════════════════════════════════════════════════ */
console.log('\n§1 Der Vorhang beim Start');
{
  const s = await seite();
  /* Sofort nach dem Laden — noch bevor die Suite auf `App` wartet. */
  const t0 = JSON.parse(await s.evaluate(`(() => {
    const v = document.getElementById('ru-vorhang');
    if (!v) return JSON.stringify({ da: false });
    const st = getComputedStyle(v);
    return JSON.stringify({
      da: true, versteckt: v.getAttribute('aria-hidden'), zeiger: st.pointerEvents,
      lage: st.position, ebene: Number(st.zIndex),
      wort: [...v.querySelectorAll('.ru-lader-buchstabe')].map(b => b.textContent).join(''),
      text: v.textContent.replace(/\\s+/g, '')
    });
  })()`) as string);
  p('Der Vorhang steht im Dokument', t0.da);
  p('… sagt dem Vorleser nichts', t0.versteckt === 'true');
  p('… nimmt keine Klicks an', t0.zeiger === 'none', t0.zeiger);
  p('… liegt über allem', t0.lage === 'fixed' && t0.ebene >= 900, t0.lage + ' / ' + t0.ebene);
  p('… und trägt den Namen der App, Buchstabe für Buchstabe', t0.wort === 'Redion', t0.wort);

  await s.waitForFunction("typeof App !== 'undefined' && document.querySelector('#page')");
  await warte(1500);
  const t1 = JSON.parse(await s.evaluate(`(() => {
    const v = document.getElementById('ru-vorhang');
    return JSON.stringify({ hidden: v.hidden, anzeige: getComputedStyle(v).display });
  })()`) as string);
  p('Nach dem Start ist er weg — binnen anderthalb Sekunden, nicht erst mit der Notbremse',
    t1.hidden === true && t1.anzeige === 'none', JSON.stringify(t1));
  await s.close();

  const html = lies('index.html');
  p('Er steht in index.html VOR dem ersten App-Skript',
    html.indexOf('id="ru-vorhang"') > 0 && html.indexOf('id="ru-vorhang"') < html.indexOf('<script src="quell/'));
  p('Die Notbremse im Stilblatt: nach sechs Sekunden von selbst auf',
    /ru-vorhang-notaus[^}]*6s forwards/.test(lies('quell/schale/stil/bausteine.css')));
  const schale = lies('src/schale/aufbau/schale.ts');
  p('`App.start` zieht ihn auf — nach dem Start UND nach einem gescheiterten Start',
    (schale.match(/vorhangWeg\(\);/g) || []).length >= 2);
}

/* ═══ §2 Die Sterne im Studio-Kopf ═════════════════════════════════════════ */
console.log('\n§2 Die Sterne im Studio-Kopf');
{
  const s = await oeffne();
  const w = JSON.parse(await s.evaluate(`(async () => {
    const k = document.getElementById('studio-auftraege');
    const ohne = k.hidden;
    await Auftraege.anlegen('ocr', { seiten: 3 }, { id: 'probe-e463-a', schritte: 3, text: 'Seite 1 von 3' });
    await Auftraege.anlegen('zip-import', { datei: 'y' }, { id: 'probe-e463-b', schritte: 0, text: 'archiv.zip' });
    await AuftragsAnzeige.knopfFrisch();
    const r = k.getBoundingClientRect();
    const mit = {
      da: !k.hidden, label: k.getAttribute('aria-label'),
      zahl: k.querySelector('b').textContent, zahlDa: !k.querySelector('b').hidden,
      sterne: k.querySelectorAll('.ru-lader-stern').length,
      breit: Math.round(r.width), hoch: Math.round(r.height),
      imKopf: !!k.closest('#studio-bar')
    };
    k.click();
    await new Promise(r => setTimeout(r, 300));
    const offen = AuftragsAnzeige.offenSichtbar();
    AuftragsAnzeige.zu();
    for (const id of ['probe-e463-a', 'probe-e463-b']) await Auftraege.abbrechen(id).catch(() => {});
    await AuftragsAnzeige.knopfFrisch();
    return JSON.stringify({ ohne, mit, offen, danach: k.hidden });
  })()`) as string);
  p('Ohne Auftrag sind die Sterne nicht da', w.ohne === true);
  p('Mit zwei Aufträgen stehen sie im Studio-Kopf', w.mit.da && w.mit.imKopf);
  p('… mit der echten Zahl', w.mit.zahl === '2' && w.mit.zahlDa, w.mit.zahl);
  p('… und dem Vorlesenamen, der die Zahl als Wort sagt (§38)',
    w.mit.label === '2 Aufträge laufen', w.mit.label);
  p('… drei Sterne, nicht fünf — in 24 px wären fünf ein Fleck', w.mit.sterne === 3, String(w.mit.sterne));
  p('Die Trefferfläche ist 44 hoch (§37)', w.mit.hoch >= 44, w.mit.hoch + ' px');
  p('Ein Druck öffnet das Auftragsfenster', w.offen === true);
  p('Sind die Aufträge vorbei, sind die Sterne wieder weg', w.danach === true);
  await s.close();
}

/* ═══ §3 Die Presse beim PDF-Einlesen ══════════════════════════════════════ */
console.log('\n§3 Die Presse beim PDF-Einlesen');
{
  const s = await oeffne();
  const w = JSON.parse(await s.evaluate(`(async () => {
    const g = Lader.schweben({ art: 'presse', text: '„skript.pdf" wird gelesen …' });
    const k = document.querySelector('.ru-lader-schwebt');
    const st = getComputedStyle(k);
    const r = k.getBoundingClientRect();
    const vorher = {
      da: !!k, imBody: k.parentElement === document.body,
      rolle: k.querySelector('.ru-lader')?.getAttribute('role'),
      art: k.querySelector('.ru-lader')?.dataset.art,
      text: k.querySelector('.ru-lader-text')?.textContent,
      zeiger: st.pointerEvents, lage: st.position,
      imBild: r.right <= innerWidth && r.bottom <= innerHeight && r.left >= 0
    };
    g.setzen({ text: 'Seite 3 von 12 …' });
    const danach = k.querySelector('.ru-lader-text')?.textContent;
    g.entfernen();
    return JSON.stringify({ vorher, danach, weg: !document.querySelector('.ru-lader-schwebt') });
  })()`) as string);
  p('`Lader.schweben` hängt eine Karte an den Körper', w.vorher.da && w.vorher.imBody);
  p('… mit der Presse und `role="status"`', w.vorher.art === 'presse' && w.vorher.rolle === 'status');
  p('… die den Satz vorliest', w.vorher.text === '„skript.pdf" wird gelesen …', w.vorher.text);
  p('… schwebt und nimmt keine Klicks an', w.vorher.lage === 'fixed' && w.vorher.zeiger === 'none');
  p('… und steht ganz im Bild', w.vorher.imBild);
  p('`setzen` schreibt die echte Seitenzahl hin', w.danach === 'Seite 3 von 12 …', w.danach);
  p('`entfernen` nimmt die Karte weg', w.weg);
  await s.close();

  /* Am Telefon steht unten die Wegeleiste — die Karte gehört darüber. */
  const h = await oeffne({ breite: 390, beruehrung: true });
  const unten = JSON.parse(await h.evaluate(`(() => {
    const g = Lader.schweben({ art: 'presse', text: 'Seite 1 von 2 …' });
    const r = document.querySelector('.ru-lader-schwebt').getBoundingClientRect();
    g.entfernen();
    return JSON.stringify({ unten: innerHeight - r.bottom, rechts: innerWidth - r.right });
  })()`) as string);
  p('Am Telefon steht die Karte über der Wegeleiste (59 px), nicht darauf',
    unten.unten >= 59, unten.unten + ' px Luft');
  await h.close();

  /* Die Verdrahtung in `einlesen.ts` — ein echtes PDF gibt es im Prüflauf
     nicht (L120), aber der Weg dorthin lässt sich lesen. */
  const q = lies('src/bereiche/pdf/einlesen.ts');
  const kopf = q.split("UI.toast('Seite wird feiner gerechnet …'")[0] ?? '';
  p('`einlesen` baut die Presse mit `Lader.schweben`', /Lader\.schweben\(\{ art: 'presse'/.test(kopf));
  p('Mit Karte kein Toast — der Satz käme sonst zweimal', /const melder = presse \? null : UI\.toast/.test(kopf));
  p('Jeder Weg hinaus nimmt beide weg: fünfmal `wegMelden()`, kein nacktes `melder.remove()`',
    (kopf.match(/wegMelden\(\);/g) || []).length === 5 && !/^\s*melder\.remove\(\);/m.test(kopf.replace(/melder\?\.remove\(\);/, '')));
  p('Die Seitenzahl geht über `sageAn` an die Karte', /sageAn\('Seite ' \+ n \+ ' von ' \+ bis/.test(kopf) && /presse\?\.setzen\(\{ text: t \}\)/.test(kopf));
}

/* ═══ §4 Die Hand im Rundgang ══════════════════════════════════════════════ */
console.log('\n§4 Die Hand im Rundgang');
{
  const s = await oeffne();
  const w = JSON.parse(await s.evaluate(`(async () => {
    const zielVon = (nr) => {
      const liste = String(Rundgang.SCHRITTE[nr].ziel).split(',').map(t => t.trim());
      for (const sel of liste) {
        const e = document.querySelector(sel);
        if (e && e.getBoundingClientRect().width) return e;
      }
      return null;
    };
    const nahe = (hand, ziel) => {
      if (!hand || !ziel) return false;
      const h = hand.getBoundingClientRect(), r = ziel.getBoundingClientRect();
      return h.left >= r.left - 5 && h.left <= r.right + 30 && h.top >= r.top - 20 && h.top <= r.bottom + 5;
    };
    Rundgang.start();
    await new Promise(r => setTimeout(r, 400));
    const hand = document.querySelector('.ru-geste');
    const st = hand ? getComputedStyle(hand) : null;
    const kasten = document.getElementById('rg-kasten');
    const eins = {
      da: !!hand, versteckt: hand?.getAttribute('aria-hidden'), zeiger: st?.pointerEvents,
      finger: hand?.querySelectorAll('.ru-geste-finger').length, text: hand?.textContent,
      nahe: nahe(hand, zielVon(0)),
      unterKasten: !!st && !!kasten && Number(st.zIndex) < Number(getComputedStyle(kasten).zIndex),
      ueberLoch: !!st && Number(st.zIndex) >= Number(getComputedStyle(document.getElementById('rg-loch')).zIndex)
    };
    document.querySelector('#rg-kasten [data-a="weiter"]').click();
    await new Promise(r => setTimeout(r, 400));
    const zwei = { nahe: nahe(document.querySelector('.ru-geste'), zielVon(1)), eine: document.querySelectorAll('.ru-geste').length };
    Rundgang.fertig();
    await new Promise(r => setTimeout(r, 100));
    return JSON.stringify({ eins, zwei, weg: !document.querySelector('.ru-geste') });
  })()`) as string);
  p('Mit dem ersten Schritt steht die Hand da', w.eins.da);
  p('… mit vier Fingern, ohne Text, für den Vorleser unsichtbar',
    w.eins.finger === 4 && w.eins.text === '' && w.eins.versteckt === 'true');
  p('… nimmt keine Klicks an', w.eins.zeiger === 'none');
  p('… und tippt auf das ECHTE Ziel des Schritts', w.eins.nahe);
  p('… über dem Loch, unter dem Kasten', w.eins.ueberLoch && w.eins.unterKasten);
  p('Beim nächsten Schritt wandert sie zum nächsten Ziel — und bleibt eine', w.zwei.nahe && w.zwei.eine === 1);
  p('Nach „Fertig" ist sie weg', w.weg);
  await s.close();
}

/* ═══ §5 Der Funkel-Knopf ══════════════════════════════════════════════════ */
console.log('\n§5 Der Funkel-Knopf');
{
  const s = await oeffne();
  const w = JSON.parse(await s.evaluate(`(async () => {
    App.kiPanel(true);
    document.getElementById('ai-tools').open = true;
    /* Länger als die Blende des Knopfes (.4 s): einmal stand hier
       rgba(16, 16, 16, 0.96) — mitten im Übergang gemessen. (Keine
       Backticks in diesem Block: er ist selbst eine Vorlagenzeichenkette.) */
    await new Promise(r => setTimeout(r, 600));
    const b = document.getElementById('ai-db');
    const st = getComputedStyle(b);
    let getroffen = false;
    b.addEventListener('click', () => { getroffen = true; }, { capture: true, once: true });
    b.querySelector('.ru-funkel-b')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise(r => setTimeout(r, 200));
    const dialog = !!document.querySelector('.overlay');
    return JSON.stringify({
      klasse: b.classList.contains('ru-funkel'),
      buchstaben: b.querySelectorAll('.ru-funkel-b').length,
      text: b.textContent.replace(/\\s+/g, ' ').trim(),
      zeichen: !!b.querySelector('svg'),
      dunkel: st.backgroundColor, rund: st.borderRadius,
      seite: document.getElementById('ai-seite').classList.contains('ru-funkel'),
      actionCount: document.querySelectorAll('.ai-quick button.ru-funkel').length,
      getroffen, dialog
    });
  })()`) as string);
  p('„Datenbank bauen" ist ein Funkel-Knopf', w.klasse);
  p('… jeder Buchstabe einzeln, Leerzeichen bleiben Text', w.buchstaben === 14, String(w.buchstaben));
  p('… der Text ist noch derselbe', w.text === 'Datenbank bauen', w.text);
  p('… das Zeichen davor auch', w.zeichen);
  p('… und der Knopf ist dunkel', /^rgba?\(16, 16, 16(, 0\.9\d*)?\)$/.test(String(w.dunkel)), w.dunkel);
  p('„Seite aufbauen" auch — jetzt alle zwölf KI-Aktionen', w.seite && w.actionCount === 12, String(w.actionCount));
  p('Ein Klick auf einen Buchstaben trifft den Knopf und öffnet die Frage', w.getroffen && w.dialog);
  await s.keyboard.press('Escape');
  await s.evaluate(`document.querySelectorAll('.overlay').forEach(o => o.remove())`);

  const l = JSON.parse(await s.evaluate(`(async () => {
    const fach = Store.addPage(null, { text: 'Elektrotechnik' });
    for (const q of ['Ohm :: U = R · I', 'Leistung :: P = U · I', 'Arbeit :: W = P · t'])
      Store.addBlock(fach.id, 'flashcard', { text: q });
    await Store.flush();
    Produktwelten.lernen('heute');
    await new Promise(r => setTimeout(r, 700));
    const b = document.querySelector('.lernwelt .is-primary[data-lw-train]');
    return JSON.stringify({ da: !!b, funkel: b?.classList.contains('ru-funkel'),
      text: b?.textContent.replace(/\\s+/g, ' ').trim(), buchstaben: b?.querySelectorAll('.ru-funkel-b').length });
  })()`) as string);
  p('„Lernen starten" in der Lernwelt glimmt auch', l.da && l.funkel, JSON.stringify(l));
  p('… und heisst noch so', /^Lernen starten/.test(String(l.text)), String(l.text));
  await s.close();
}

/* ═══ §6 Das Rauschen als Cover ════════════════════════════════════════════ */
console.log('\n§6 Das Rauschen als Cover');
{
  const s = await oeffne();
  const w = JSON.parse(await s.evaluate(`(async () => {
    const seite = Store.addPage(null, { text: 'Nachtschicht' });
    Store.updateBlock(seite.id, { cover: 'textur:nacht' });
    await Store.flush();
    App.oeffne(seite.id);
    await new Promise(r => setTimeout(r, 400));
    const c = document.querySelector('.cover');
    const auf = {
      da: !!c, klasse: c?.className, lagen: c?.querySelectorAll('.ru-textur').length,
      verlauf: /linear-gradient/.test(getComputedStyle(c).backgroundImage),
      halter: document.querySelectorAll('#ru-textur-halter').length
    };
    Kopfleiste.coverWaehlen(Store.getBlock(seite.id));
    await new Promise(r => setTimeout(r, 250));
    const kacheln = [...document.querySelectorAll('.cover-overlay .cover-gitter button.cover-textur')];
    const wahl = {
      kacheln: kacheln.length,
      lagenJe: kacheln.every(k => k.querySelectorAll('.ru-textur').length === 2),
      an: document.querySelector('.cover-overlay [data-c="textur:nacht"]')?.classList.contains('on'),
      halter: document.querySelectorAll('#ru-textur-halter').length
    };
    document.querySelector('.cover-overlay [data-c="textur:sand"]').click();
    await new Promise(r => setTimeout(r, 300));
    const gewaehlt = { cover: Store.getBlock(seite.id).cover, klasse: document.querySelector('.cover')?.className };
    /* Der alte Fehler: ein konischer Verlauf wurde als Bildadresse gelesen. */
    Store.updateBlock(seite.id, { cover: 'conic-gradient(from 20deg,#ffa344,#e03e3e,#9a6dd7,#ffa344)' });
    App.zeichneSeite();
    await new Promise(r => setTimeout(r, 300));
    const konisch = getComputedStyle(document.querySelector('.cover')).backgroundImage;
    return JSON.stringify({ auf, wahl, gewaehlt, konisch });
  })()`) as string);
  p('Die Seite trägt das Rauschen als Cover', w.auf.da && /cover-textur-nacht/.test(String(w.auf.klasse)));
  p('… zwei Lagen darauf, über einem Verlauf', w.auf.lagen === 2 && w.auf.verlauf);
  p('Die Cover-Wahl zeigt drei Rausch-Kacheln, jede mit zwei Lagen', w.wahl.kacheln === 3 && w.wahl.lagenJe);
  p('… und die gewählte ist markiert', w.wahl.an === true);
  p('Der Filterhalter ist genau EINMAL da — auch nach der Wahl (E440)', w.auf.halter === 1 && w.wahl.halter === 1,
    w.auf.halter + ' / ' + w.wahl.halter);
  p('Eine Kachel wählen schreibt den Namen in den Block', w.gewaehlt.cover === 'textur:sand' && /cover-textur-sand/.test(String(w.gewaehlt.klasse)));
  p('Ein konischer Verlauf ist wieder ein Verlauf, keine Bildadresse', /conic-gradient/.test(w.konisch), w.konisch.slice(0, 40));
  await s.close();
}

/* ═══ §7 Der Blick kommt vom Deckel, ohne Auge ════════════════════════════ */
console.log('\n§7 Der Blick kommt vom Deckel, ohne Auge');
{
  const s = await oeffne();
  const w = JSON.parse(await s.evaluate(`(async () => {
    const fach = Store.addPage(null, { text: 'Elektrotechnik' });
    Store.updateBlock(fach.id, { heftArt: 'fach' });
    for (const t of ['Kapitel 2', 'Formelsammlung', 'Prüfung']) Store.addPage(fach.id, { text: t });
    Store.addPage(null, { text: 'Lose Notiz' });
    await Store.flush();
    Store.setMeta('bibOrdner', '');
    Bibliothek.oeffne();
    await new Promise(r => setTimeout(r, 500));
    /* Ein Zeiger, der wirklich schwebt — „pointerType" entscheidet, ob die
       App ihn als Überfahren nimmt. */
    const schau = (el, art) => {
      const r = el.getBoundingClientRect();
      el.dispatchEvent(new PointerEvent('pointerenter', { bubbles: false,
        pointerId: 1, pointerType: art, isPrimary: true,
        clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }));
    };
    const deckel = document.querySelector('.bib-deckel[data-art="ordner"]');
    const bau = {
      /* DAS AUGE IST WEG — nirgends, nicht nur an diesem einen Ordner. */
      augen: document.querySelectorAll('.bib-blick').length,
      zellen: document.querySelectorAll('.bib-zelle').length,
      deckel: !!deckel,
      ordner: document.querySelectorAll('.bib-deckel[data-art="ordner"]').length,
      andere: document.querySelectorAll('.bib-deckel:not([data-art="ordner"])').length
    };

    /* --- Die Maus --- */
    schau(deckel, 'mouse');
    await new Promise(r => setTimeout(r, 600));
    const maus = { da: !!document.querySelector('.ru-fach-lage'),
                   nochHier: Store.getMeta('bibOrdner', '') === '' };
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise(r => setTimeout(r, 250));
    const zu = !document.querySelector('.ru-fach-lage');

    /* --- Der Stift. Er darf NICHT an der „hover: hover"-Abfrage
           scheitern: auf einem Laptop mit Berührungsbildschirm beschreibt
           sie den Finger, nicht den schwebenden Stift. --- */
    schau(deckel, 'pen');
    await new Promise(r => setTimeout(r, 600));
    const stift = !!document.querySelector('.ru-fach-lage');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise(r => setTimeout(r, 250));

    /* --- Der Finger öffnet nichts per Überfahren --- */
    schau(deckel, 'touch');
    await new Promise(r => setTimeout(r, 600));
    const finger = !!document.querySelector('.ru-fach-lage');

    /* --- UND DER WEG MIT DEM FINGER IST NICHT WEG: „Blick hinein" steht
           weiter im ⌄-Menü. Ohne ihn hätte das Auge nicht gehen dürfen. --- */
    document.querySelector('.bib-deckel[data-art="ordner"] .bib-deckel-mehr').click();
    await new Promise(r => setTimeout(r, 300));
    const imMenue = [...document.querySelectorAll('.menu [data-a]')]
      .some(b => b.dataset.a === 'blick');
    document.querySelectorAll('.menu').forEach(m => m.remove());
    await new Promise(r => setTimeout(r, 150));

    /* --- Der Deckel selbst geht weiter in den Ordner --- */
    deckel.click();
    await new Promise(r => setTimeout(r, 400));
    return JSON.stringify({ bau, maus, zu, stift, finger, imMenue,
      drin: Store.getMeta('bibOrdner', '') === fach.id });
  })()`) as string);
  p('Kein Auge mehr — nirgends im Regal', w.bau.augen === 0 && w.bau.zellen === 0,
    JSON.stringify(w.bau));
  p('Die Ordnerkachel steht allein da', w.bau.deckel && w.bau.ordner === 1 && w.bau.andere >= 1,
    JSON.stringify(w.bau));
  p('Die MAUS über dem Deckel öffnet die Karte, ohne in den Ordner zu gehen',
    w.maus.da && w.maus.nochHier, JSON.stringify(w.maus));
  p('Escape schliesst sie', w.zu);
  p('Der STIFT öffnet sie ebenso — Redur hat ihn ausdrücklich genannt', w.stift);
  p('Der FINGER öffnet sie nicht per Überfahren — er tippt gerade', !w.finger);
  p('„Blick hinein" steht weiter im ⌄-Menü — der Weg am Telefon bleibt (§37)', w.imMenue);
  p('Der Deckel selbst öffnet weiter den Ordner', w.drin);
  await s.close();
}

/* ═══ §8 Ohne Bewegung ═════════════════════════════════════════════════════ */
console.log('\n§8 Ohne Bewegung');
{
  const s = await oeffne({ ruhig: true });
  const w = JSON.parse(await s.evaluate(`(async () => {
    Rundgang.start();
    App.kiPanel(true);
    await new Promise(r => setTimeout(r, 400));
    const anim = (sel) => { const e = document.querySelector(sel); return e ? getComputedStyle(e).animationName : 'FEHLT'; };
    const v = document.getElementById('ru-vorhang'); v.hidden = false;
    const wert = {
      finger: anim('.ru-geste-finger'), buchstabe: anim('.ru-funkel-b'),
      vorhang: anim('#ru-vorhang .ru-lader-buchstabe')
    };
    v.hidden = true;
    Rundgang.fertig();
    return JSON.stringify(wert);
  })()`) as string);
  p('Die Finger stehen still', w.finger === 'none', w.finger);
  p('Die Buchstaben glimmen nicht', w.buchstabe === 'none', w.buchstabe);
  p('Der Vorhang blinkt nicht', w.vorhang === 'none', w.vorhang);
  await s.close();
}

/* ═══ §9 Eingebunden ═══════════════════════════════════════════════════════ */
console.log('\n§9 Eingebunden');
for (const name of ['geste', 'funkel']) {
  p(`index.html lädt ${name}.js`, new RegExp('quell/schale/bedienung/' + name + '\\.js').test(lies('index.html')));
  p(`Der GRUNDSTOCK kennt ${name}.js (§28)`,
    new RegExp('\\./quell/schale/bedienung/' + name + '\\.js').test(lies('src/dienst/sw.ts')));
  p(`${name}: die Quelle ist TypeScript, das .js ist erzeugt`,
    fs.existsSync(path.join(WURZEL, 'src/schale/bedienung/' + name + '.ts')) &&
    /ERZEUGT/.test(lies('quell/schale/bedienung/' + name + '.js')));
}

p('Keine Fehler auf den Seiten', fehler.length === 0, fehler.slice(0, 3).join(' | '));
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
