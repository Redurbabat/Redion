/* Suite 208 — Aufgaben, deren Antwort GERECHNET ist (Elektro, Punkte 52, 53, 59)
 * ============================================================================
 * Drei Aufgabenarten zeigen einen Schaltplan und fragen etwas, das man nur
 * beantworten kann, wenn man ihn liest:
 *
 *   plan-leitung   Eine Leitung fehlt. Welche?
 *   plan-fehler    Die Schaltung tut nicht, was sie soll. Woran liegt es?
 *   plan-leuchtet  Leuchtet die Leuchte bei diesen Stellungen?
 *
 * Bei allen dreien steht die Lösung nirgends geschrieben. Sie kommt aus
 * `Stromfluss.rechne`. Das ist der Vorteil — und genau deshalb prüft dieser
 * Lauf sie NICHT mit demselben Weg, auf dem sie entstanden ist. Er baut die
 * Netzliste selbst, probiert die Schalterstellungen selbst durch und sieht
 * nach, ob die behauptete Antwort stimmt. Ein Prüflauf, der die Lösung aus
 * derselben Funktion holt wie die Aufgabe, prüft nur, dass zweimal dasselbe
 * herauskommt.
 *
 * DREI FEHLER, DIE ES OHNE DIESEN LAUF NOCH GÄBE — alle drei waren zu sehen,
 * nicht zu erraten, und alle drei sind hier als Wächter festgehalten:
 *
 * §1 EINE LEITUNG HAT KEINE RICHTUNG. „G1:L — E1:X1" und „E1:X1 — G1:L"
 *    sind derselbe Draht. Beide standen zur Wahl, in 56 von 600 Würfelungen,
 *    und wer den zweiten anklickte, bekam ein rotes Kreuz für die richtige
 *    Antwort. Eine Prüfung auf doppelte Zeichenketten sieht das nicht: die
 *    beiden Texte SIND verschieden.
 *
 * §2 EINE MÖGLICHKEIT, DIE NIE STIMMT, IST GESCHENKT. „Die Quelle liefert zu
 *    wenig Spannung" stand als vierte Antwort da und war in 120 Würfelungen
 *    kein einziges Mal die Lösung. Wer das merkt, hat von vier Möglichkeiten
 *    nur noch drei — und lernt nebenbei, dass es diesen Fall nicht gibt.
 *
 * §3 EINE ZAHL, DIE NICHTS BEDEUTET, IST SCHLIMMER ALS KEINE. Bei einem
 *    Kurzschluss stand in der Erklärung „Nachgerechnet fliessen 460000 A".
 *    Die Simulation rechnet mit einer idealen Quelle; die Zahl ist das
 *    Ergebnis einer Division durch fast Null und kein Messwert. Ein
 *    Lernender merkt sie sich trotzdem.
 *
 *   node pruefungen/lauf/test243.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const Schaltplan: any; declare const Elektroarbeitsplatz: any;
declare const Stromfluss: any; declare const Elektroaufgaben: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8963;

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json', '.mjs': 'text/javascript',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
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

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
await seite.evaluate(() => { Store.setMeta('rundgangGesehen', true);
                             Store.setMeta('neuerungenGesehen', 99);
                             Store.setMeta('kartenGemeldet', new Date().toISOString().slice(0, 10)); });
await seite.reload();
await seite.waitForTimeout(2400);
await seite.evaluate(() =>
  document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove()));

/* Das eigene Werkzeug des Prüflaufs: eine Stellung suchen, bei der etwas
   passiert, und nachsehen, wie hell es dabei wird. Bewusst NICHT
   `besteStellung` aus dem Aufgabenmodul — sonst prüfte der Lauf sich selbst. */
const WERKZEUG = `
  const schalterVon = (plan) => plan.teile.filter(t => {
    const vh = Stromfluss.verhalten(t.zeichen);
    return vh && vh.art === 'schalter' && !vh.folgtSpule;
  });
  /* Alle Stellungskombinationen durchgehen — bei bis zu drei Schaltern mit je
     höchstens drei Stellungen sind das 27 Fälle, und die rechnen sich in
     Millisekunden. Vollständig statt gierig: eine gierige Suche könnte an
     einer UND-Verknüpfung hängenbleiben, wo erst der zweite Schalter etwas
     ändert. */
  const alleStellungen = (plan) => {
    const s = schalterVon(plan);
    let liste = [{}];
    for (const t of s) {
      const st = Stromfluss.stellungenVon(t.zeichen);
      const neu = [];
      for (const bisher of liste)
        for (let i = 0; i < st.length; i++) neu.push({ ...bisher, [t.id]: i });
      liste = neu;
      if (liste.length > 200) break;
    }
    return liste;
  };
  const misst = (plan, stellung) => {
    const e = Stromfluss.rechne(plan, stellung);
    if (!e || !e.ok) return { ok: false, hell: 0, strom: 0, warnungen: ['nicht rechenbar'] };
    let hell = 0, strom = 0;
    plan.teile.forEach(t => {
      const vh = Stromfluss.verhalten(t.zeichen);
      if (!vh || (vh.art !== 'widerstand' && vh.art !== 'spule')) return;
      const w = e.werte[t.id]; if (!w) return;
      if (typeof w.helligkeit === 'number' && w.helligkeit > hell) hell = w.helligkeit;
      if (Math.abs(w.I) > strom) strom = Math.abs(w.I);
    });
    return { ok: true, hell, strom, warnungen: e.warnungen || [] };
  };
  const bestes = (plan) => {
    let b = { ok: false, hell: 0, strom: 0, warnungen: [] };
    for (const st of alleStellungen(plan)) {
      const m = misst(plan, st);
      if (m.hell > b.hell || (m.hell === b.hell && m.strom > b.strom)) b = m;
    }
    return b;
  };
  /* Eine Leitung ergänzen, die zwei benannte Klemmen verbindet. Die Punkte
     liegen weit weg vom Plan — die Simulation verbindet über die
     Klemmenangabe, nicht über die Geometrie.

     ZWEI BAUTEILE DÜRFEN DASSELBE KENNZEICHEN TRAGEN. Bei einem Schütz ist
     genau das die Norm: die Spule heisst K1 und ihr Kontakt heisst auch K1,
     weil sie zusammengehören. Wer „K1" nachschlägt und das erste Bauteil
     nimmt, greift die Spule und sucht dort vergeblich die Klemme 14. Zuerst
     stand hier genau das, und der Lauf meldete daraufhin, die richtige
     Leitung helfe nicht — sie war nur nie angeschlossen worden.
     Aufgelöst wird deshalb über die KLEMME, nicht über den Namen. */
  const klemmen = (t) => {
    try { return Schaltplan.anschluesseVon(t).map(a => String(a.nr)); }
    catch (e) { return []; }
  };
  const findeKlemme = (plan, text) => {
    const bmk = text.split(':')[0];
    const nr = text.split(':').slice(1).join(':');
    const gleiche = plan.teile.filter(t => String(t.bmk) === bmk);
    const passt = gleiche.find(t => klemmen(t).includes(nr));
    return passt ? { teil: passt, nr } : null;
  };
  const verbinde = (plan, text) => {
    const [a, b] = text.split(' — ');
    if (!a || !b) return null;
    const ka = findeKlemme(plan, a), kb = findeKlemme(plan, b);
    if (!ka || !kb) return null;
    const kopie = JSON.parse(JSON.stringify(plan));
    const id = (t) => t.id;
    kopie.leitungen.push({ id: 'pruef', ebene: 'plan',
      punkte: [{ x: -2000, y: -2000 }, { x: -1980, y: -2000 }],
      vonTeil: id(ka.teil), vonNr: ka.nr,
      nachTeil: id(kb.teil), nachNr: kb.nr });
    return kopie;
  };
  /* Wie sich eine Schaltung über ALLE Stellungen verhält — als Zeichenkette,
     damit zwei Schaltungen vergleichbar sind. Zwei Pläne mit demselben
     Verhaltensmuster sind für den Lernenden dieselbe Schaltung. */
  const muster = (plan) => alleStellungen(plan).map(st => {
    const m = misst(plan, st);
    return !m.ok ? 'x' : m.hell > 0.8 ? 'H' : m.hell > 0.02 ? 'h'
         : m.strom > 1e-4 ? 's' : '.';
  }).join('');
`;

/* ==========================================================================
 * §1 · Fehlende Leitung — ist die genannte wirklich die einzige richtige?
 * ========================================================================*/
console.log('\n1 · Fehlende Leitung (Punkt 52)');

const leitung = await seite.evaluate(`(() => {
  ${WERKZEUG}
  const aus = { erzeugt: 0, leer: 0, hilftNicht: [], zweiteLoesung: [],
                umgedreht: [], ohneLoesung: [], ohneStellungen: 0,
                falscherSatz: [] };
  for (let s = 1; s <= 200; s++) {
    const a = Elektroaufgaben.erzeuge('plan-leitung', s);
    if (!a) { aus.leer++; continue; }
    aus.erzeugt++;
    if (!a.stellungen) aus.ohneStellungen++;
    if (!a.optionen.includes(a.loesung)) aus.ohneLoesung.push(s);

    /* Dieselbe Leitung andersherum geschrieben? */
    const dreh = (x) => x.split(' — ').slice().reverse().join(' — ');
    for (const o of a.optionen)
      if (o !== a.loesung && dreh(o) === a.loesung) aus.umgedreht.push(s + ': ' + o);

    /* Die Leitung muss das VERHALTEN ändern — nicht bloss die grösste
       erreichbare Helligkeit. Zuerst stand hier der Vergleich der besten
       Stellung, und der meldete eine Wechselschaltung als heil: ohne den
       fehlenden Draht leuchtet sie ja noch, man muss nur den anderen
       Schalter umlegen. Genau das ist aber der Fehler, den die Aufgabe
       zeigt — von zwei bedienbaren Stellen bleibt eine übrig. */
    const mit = verbinde(a.plan, a.loesung);
    if (!mit) { aus.hilftNicht.push(s + ': Klemmen nicht gefunden'); continue; }
    const gut = bestes(mit);
    const sollMuster = muster(mit);
    if (!(gut.hell > 0.02 || gut.strom > 1e-4))
      aus.hilftNicht.push(s + ': auch MIT der Leitung tut sich nichts');
    else if (muster(a.plan) === sollMuster)
      aus.hilftNicht.push(s + ': ohne sie verhält sie sich genauso (' + sollMuster + ')');

    /* Und was die Erklärung behauptet, muss stimmen. „Der Stromkreis ist
       offen" darf nur dastehen, wenn in KEINER Stellung etwas fliesst. */
    const totOhne = [...muster(a.plan)].every(c => c === '.' || c === 'x');
    if (/Stromkreis offen/.test(a.erklaerung) && !totOhne)
      aus.falscherSatz.push(s + ': „offen", aber Muster ' + muster(a.plan));

    /* Und kein Ablenker darf DIESELBE SCHALTUNG ergeben.
       „Ergibt Licht" genügt als Massstab nicht. Beim Zeitrelais liess ein
       Ablenker die Leuchte in JEDER Stellung brennen — sie leuchtete, aber
       der Kontakt schaltete nichts mehr, und das ist eine andere Schaltung.
       Verglichen wird deshalb das Verhalten über alle Stellungen: gleiches
       Muster heisst zweite richtige Antwort. */
    for (const o of a.optionen) {
      if (o === a.loesung) continue;
      const k = verbinde(a.plan, o);
      if (!k) continue;
      if (muster(k) === sollMuster)
        aus.zweiteLoesung.push(s + ': „' + o + '" ergibt dasselbe (' + sollMuster + ')');
    }
  }
  return aus;
})()`) as any;

p('Aus zweihundert Startwerten kommen Aufgaben', leitung.erzeugt >= 190,
  `${leitung.erzeugt}/200`);
p('Jede enthält ihre eigene Lösung', !leitung.ohneLoesung.length,
  leitung.ohneLoesung.slice(0, 3).join(', '));
p('Keine Leitung steht doppelt — einmal vorwärts, einmal rückwärts',
  !leitung.umgedreht.length, leitung.umgedreht.slice(0, 3).join(' | '));
p('Die genannte Leitung schliesst den Kreis wirklich',
  !leitung.hilftNicht.length, leitung.hilftNicht.slice(0, 3).join(' | '));
p('Und keiner der Ablenker täte es auch',
  !leitung.zweiteLoesung.length, leitung.zweiteLoesung.slice(0, 3).join(' | '));
p('Die Erklärung behauptet nicht „offen", wo es noch leuchtet',
  !leitung.falscherSatz.length, leitung.falscherSatz.slice(0, 3).join(' | '));
p('Die Schalterstellungen liegen als Daten bei', leitung.ohneStellungen === 0,
  `${leitung.ohneStellungen} ohne`);

/* ==========================================================================
 * §2 · Fehler suchen — jeder Schaden kommt vor, und die Erklärung zeigt hin
 * ========================================================================*/
console.log('\n2 · Fehler suchen (Punkt 53)');

const suchen = await seite.evaluate(`(() => {
  ${WERKZEUG}
  const aus = { erzeugt: 0, loesungen: {}, ohneOrt: [], nichtKaputt: [],
                moeglichkeiten: new Set(), ohneLoesung: [], unsichtbar: [] };
  for (let s = 1; s <= 200; s++) {
    const a = Elektroaufgaben.erzeuge('plan-fehler', s);
    if (!a) continue;
    aus.erzeugt++;
    aus.loesungen[a.loesung] = (aus.loesungen[a.loesung] || 0) + 1;
    a.optionen.forEach(o => aus.moeglichkeiten.add(o));
    if (!a.optionen.includes(a.loesung)) aus.ohneLoesung.push(s);

    /* Die Erklärung muss einen ORT nennen, nicht nur ein Ergebnis. Ein
       Betriebsmittelkennzeichen im Text ist der Beleg dafür. */
    if (!/[A-Z]\\d/.test(a.erklaerung)) aus.ohneOrt.push(s + ': ' + a.erklaerung);

    /* Und der Plan muss wirklich kaputt sein — irgendetwas fehlt, brückt
       oder liefert zu wenig. */
    const m = bestes(a.plan);
    const heil = m.ok && m.hell > 0.8 && !m.warnungen.length;
    if (heil) aus.nichtKaputt.push(s + ': tut trotzdem alles');

    /* DER FEHLER MUSS IM BILD STEHEN, nicht nur in der Netzliste.
       Eine Brücke wurde zuerst mit Punkten weit ausserhalb des Blattes
       eingetragen: gerechnet lag sie da, gezeichnet nicht. Und die zu
       niedrige Spannung stand überhaupt nirgends — die Zeichnung sah heil
       aus, und die Aufgabe war nur durch Ausschluss zu lösen.
       Geprüft wird deshalb am gezeichneten SVG, nicht am Datenmodell. */
    const svg = Schaltplan.alsSvg(a.plan, { raster: false, bmk: true });
    if (/überbrückt/.test(a.loesung)) {
      const b = a.plan.leitungen.find(l => l.id === 'kurz');
      const drin = b && b.punkte.every(pt =>
        pt.x >= -20 && pt.y >= -20 &&
        pt.x <= (a.plan.breite || 0) + 20 && pt.y <= (a.plan.hoehe || 0) + 20);
      if (!drin) aus.unsichtbar.push(s + ': Brücke liegt ausserhalb des Blattes');
    }
    if (/Spannung/.test(a.loesung) && !/\\bV\\b/.test(svg))
      aus.unsichtbar.push(s + ': keine Spannungsangabe in der Zeichnung');
  }
  aus.moeglichkeiten = [...aus.moeglichkeiten];
  return aus;
})()`) as any;

p('Aus zweihundert Startwerten kommen Aufgaben', suchen.erzeugt >= 190,
  `${suchen.erzeugt}/200`);
p('Jede enthält ihre eigene Lösung', !suchen.ohneLoesung.length,
  suchen.ohneLoesung.slice(0, 3).join(', '));
const nie = suchen.moeglichkeiten.filter((m: string) => !suchen.loesungen[m]);
p('Jede angebotene Möglichkeit ist irgendwann auch die Lösung',
  nie.length === 0, `nie richtig: ${nie.join(' | ')}`);
p('… und keine davon nur ein einzelnes Mal',
  Object.values(suchen.loesungen).every((n: any) => n >= 10),
  JSON.stringify(suchen.loesungen));
p('Die Erklärung sagt, WO der Fehler sitzt', !suchen.ohneOrt.length,
  suchen.ohneOrt.slice(0, 2).join(' | '));
p('Und der gezeigte Plan ist wirklich beschädigt', !suchen.nichtKaputt.length,
  suchen.nichtKaputt.slice(0, 3).join(' | '));
p('Der Fehler ist im Bild zu SEHEN, nicht nur zu rechnen',
  !suchen.unsichtbar.length, suchen.unsichtbar.slice(0, 3).join(' | '));

/* ==========================================================================
 * §3 · Leuchtet es — nachgerechnet mit eigenem Werkzeug
 * ========================================================================*/
console.log('\n3 · Leuchtet es (Punkt 59)');

const leuchtet = await seite.evaluate(`(() => {
  ${WERKZEUG}
  const aus = { erzeugt: 0, loesungen: {}, falsch: [], grosseZahl: [],
                ohneStellungen: 0, ohneLoesung: [], moeglichkeiten: new Set(),
                kippe: [] };
  for (let s = 1; s <= 200; s++) {
    const a = Elektroaufgaben.erzeuge('plan-leuchtet', s);
    if (!a) continue;
    aus.erzeugt++;
    aus.loesungen[a.loesung] = (aus.loesungen[a.loesung] || 0) + 1;
    a.optionen.forEach(o => aus.moeglichkeiten.add(o));
    if (!a.optionen.includes(a.loesung)) aus.ohneLoesung.push(s);
    if (!a.stellungen) { aus.ohneStellungen++; continue; }

    /* Keine Zahl über tausend in einer Erklärung. Der einzige Weg, wie eine
       hineingerät, ist eine Rechnung, die niemand nachmessen kann. */
    for (const m of String(a.erklaerung).matchAll(/[0-9][0-9.']*/g)) {
      const z = Number(String(m[0]).replace(/'/g, ''));
      if (Number.isFinite(z) && z > 1000) aus.grosseZahl.push(s + ': ' + m[0]);
    }

    /* Selbst nachrechnen, bei GENAU den angegebenen Stellungen. */
    const e = Stromfluss.rechne(a.plan, a.stellungen);
    const kurz = (e && e.warnungen || []).some(w => /überbrückt/.test(w));
    const m2 = misst(a.plan, a.stellungen);
    const soll = kurz ? 'Die Sicherung löst aus.'
      : m2.hell > 0.8 ? 'Ja, mit voller Helligkeit.'
      : m2.hell > 0.02 ? 'Ja, aber schwächer als normal.'
      : 'Nein, es bleibt dunkel.';
    if (soll !== a.loesung)
      aus.falsch.push(s + ': steht „' + a.loesung + '", gerechnet „' + soll + '"');

    /* KEINE AUFGABE DARF AUF DER KIPPE STEHEN. Wer 79 % Helligkeit von 81 %
       unterscheiden soll, rät. Zwischen „schwächer" und „voll" muss deshalb
       ein Abstand liegen, den ein Mensch auch sieht: alles über 60 % gilt
       als voll, alles darunter als deutlich schwächer, und dazwischen soll
       gar nichts liegen. */
    if (m2.hell > 0.60 && m2.hell < 0.95 && !kurz)
      aus.kippe.push(s + ': ' + Math.round(m2.hell * 100) + ' % — voll oder schwach?');
  }
  aus.moeglichkeiten = [...aus.moeglichkeiten];
  return aus;
})()`) as any;

p('Aus zweihundert Startwerten kommen Aufgaben', leuchtet.erzeugt >= 190,
  `${leuchtet.erzeugt}/200`);
p('Jede enthält ihre eigene Lösung', !leuchtet.ohneLoesung.length,
  leuchtet.ohneLoesung.slice(0, 3).join(', '));
p('Die Stellungen liegen als Daten bei', leuchtet.ohneStellungen === 0,
  `${leuchtet.ohneStellungen} ohne`);
p('Selbst nachgerechnet stimmt jede Antwort', !leuchtet.falsch.length,
  leuchtet.falsch.slice(0, 3).join(' | '));
const nieL = leuchtet.moeglichkeiten.filter((m: string) => !leuchtet.loesungen[m]);
p('Jede der vier Antworten kommt irgendwann auch vor', nieL.length === 0,
  `nie richtig: ${nieL.join(' | ')}`);
p('… auch „schwächer als normal", die Zwischenstufe',
  (leuchtet.loesungen['Ja, aber schwächer als normal.'] || 0) >= 5,
  JSON.stringify(leuchtet.loesungen));
p('Der Kurzschluss kommt wirklich vor',
  (leuchtet.loesungen['Die Sicherung löst aus.'] || 0) >= 5,
  JSON.stringify(leuchtet.loesungen));
p('… und es bleibt nicht bei ihm allein',
  Object.keys(leuchtet.loesungen).length >= 3,
  Object.keys(leuchtet.loesungen).join(' | '));
p('Keine Erklärung nennt eine Zahl über tausend', !leuchtet.grosseZahl.length,
  leuchtet.grosseZahl.slice(0, 3).join(' | '));
p('Keine Aufgabe steht zwischen „voll" und „schwach" auf der Kippe',
  !leuchtet.kippe.length, leuchtet.kippe.slice(0, 3).join(' | '));

/* ==========================================================================
 * §4 · Die Pläne lassen sich zeichnen und lesen
 * ========================================================================*/
console.log('\n4 · Die Pläne');

const zeichnen = await seite.evaluate(`(() => {
  const aus = { leer: [], ohneBmk: [], ohneTeile: [], gross: 0, klein: 0 };
  for (const art of ['plan-leitung', 'plan-fehler', 'plan-leuchtet']) {
    for (let s = 1; s <= 40; s++) {
      const a = Elektroaufgaben.erzeuge(art, s);
      if (!a || !a.plan) continue;
      if (!a.plan.teile.length) { aus.ohneTeile.push(art + ':' + s); continue; }
      if (a.plan.teile.some(t => !t.bmk)) aus.ohneBmk.push(art + ':' + s);
      const svg = Schaltplan.alsSvg(a.plan, { raster: false, bmk: true, nummern: true });
      if (!svg || svg.length < 200) { aus.leer.push(art + ':' + s); continue; }
      /* Die Zeichnung muss auf ein Aufgabenfeld passen — ein Plan, der
         viertausend Einheiten breit ist, wird zur Briefmarke. */
      const m = /viewBox="([^"]+)"/.exec(svg);
      if (m) {
        const [, , bx] = m[1].split(/\\s+/).map(Number);
        if (bx > 2600) aus.gross++;
        if (bx < 60) aus.klein++;
      }
    }
  }
  return aus;
})()`) as any;

p('Jede Aufgabe bringt Bauteile mit', !zeichnen.ohneTeile.length,
  zeichnen.ohneTeile.slice(0, 3).join(', '));
p('Jedes Bauteil trägt ein Kennzeichen', !zeichnen.ohneBmk.length,
  zeichnen.ohneBmk.slice(0, 3).join(', '));
p('Jeder Plan zeichnet sich', !zeichnen.leer.length,
  zeichnen.leer.slice(0, 3).join(', '));
p('Keiner wird zur Briefmarke', zeichnen.gross === 0, `${zeichnen.gross} zu breit`);
p('Und keiner verschwindet', zeichnen.klein === 0, `${zeichnen.klein} zu schmal`);

/* ==========================================================================
 * §5 · Im Üben-Fenster
 * ========================================================================*/
console.log('\n5 · Beim Üben');

await seite.evaluate(() => {
  Store.setMeta('elektro:uebungsarten', ['plan-leuchtet']);
  document.querySelectorAll('.overlay').forEach(x => x.remove());
});
await seite.evaluate(() =>
  Elektroarbeitsplatz.zeigeAls('Üben', Elektroarbeitsplatz.uebung()));
await seite.waitForTimeout(700);

p('Das Fenster steht', await seite.locator('.ea-frage').count() > 0);
const planDa = await seite.locator('.ea-plan svg').count();
p('Und zeigt einen Schaltplan', planDa > 0, `${planDa} SVG`);
/* Mehrzeilige Fragen stehen in zwei Klassen: die erste Zeile in `.ea-frage`,
   die weiteren in `.ea-frage-zusatz`. Wer nur die erste liest, sieht bei
   „Leuchtet es?" die Schalterstellungen nicht — und meldet einen Mangel, den
   nur der Prüflauf hat. */
const frage = (await seite.locator('.ea-frage, .ea-frage-zusatz')
  .allInnerTexts()).join('\n');
p('Die Frage nennt die Schalterstellungen', /Stellung/i.test(frage),
  frage.replace(/\n/g, ' / ').slice(0, 90));
const planKasten = await seite.locator('.ea-plan').first().boundingBox();
p('Der Plan ist gross genug zum Lesen',
  !!planKasten && planKasten.height > 90, JSON.stringify(planKasten));
p('Es gibt vier Möglichkeiten', await seite.locator('.ea-option').count() === 4);

/* Antworten, und die Erklärung ansehen. */
await seite.locator('.ea-option').first().click();
await seite.waitForTimeout(400);
const aufl = await seite.locator('.ea-aufloesung').innerText().catch(() => '');
p('Nach der Antwort kommt eine Erklärung', aufl.length > 20, aufl.slice(0, 70));
p('… und sie enthält keine Zahl über tausend',
  ![...aufl.matchAll(/[0-9][0-9.']*/g)]
    .map(m => Number(String(m[0]).replace(/'/g, '')))
    .some(z => Number.isFinite(z) && z > 1000), aufl.slice(0, 90));

p('Keine Fehler auf der Seite', !fehler.length, fehler.slice(0, 2).join(' | '));

console.log(`\n${ok} bestanden, ${weg} gescheitert`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
