/* Suite 280 — Die Auftragsmaschine überlebt den Neustart (E286)
 * ============================================================================
 * Der Sinn dieser Maschine ist genau EINE Sache: Arbeit, die länger dauert
 * als ein offener Tab, geht nicht verloren. Alles andere daran ist Beiwerk.
 *
 * Deshalb ist §4 der Abschnitt, um den es geht — dort wird ein Auftrag
 * mitten in der Arbeit weggerissen (Seite neu geladen), und danach muss er
 * beim LETZTEN FERTIGEN SCHRITT weitermachen und nicht von vorn.
 *
 *   §1 DAS MODELL rechnet richtig — ohne Browser, ohne Uhr, ohne Ablage.
 *   §2 DAS FACH ist da, und die Sicherung sagt, dass sie es auslässt.
 *   §3 EIN AUFTRAG läuft durch: anlegen, arbeiten, fertig.
 *   §4 DER NEUSTART mitten in der Arbeit — der eigentliche Punkt.
 *   §5 DER FEHLER: dreimal versucht, dann liegt er in der Fehlerablage
 *      und verschwindet NICHT.
 *   §6 ZWEI TABS nehmen nicht denselben Auftrag.
 *   §7 ABBRECHEN, wartend und laufend.
 *   §8 DAS ERSETZEN räumt die Aufträge weg — sie zeigen ins Leere.
 *
 * ─── KANN ER ROT WERDEN? (§55.2) ────────────────────────────────────────────
 * §4 wäre vor E286 nicht nur rot, sondern gar nicht formulierbar: es gab
 * nichts, was einen Neustart überlebte. §5 hat eine Gegenprobe (ein
 * Auftrag mit `maxVersuche: 1` scheitert nach EINEM Versuch, nicht nach
 * drei). §6 misst mit zwei echten Fenstern auf derselben Ablage.
 *
 *   node pruefungen/lauf/test280.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
declare const Auftraege: any; declare const JobModell: any; declare const Umzuege: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9058;

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
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
/* EIN Kontext für beide Fenster — sonst hätten sie getrennte IndexedDB,
   und §6 prüfte zwei Datenbanken statt zweier Tabs. */
const ctx = await browser.newContext();
const seite = await ctx.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));

const bereit = async (s: any): Promise<void> => {
  await s.waitForFunction(
    () => typeof Store !== 'undefined' && typeof App !== 'undefined' &&
          typeof (globalThis as any).Auftraege !== 'undefined', null, { timeout: 30000 });
  await s.waitForTimeout(1200);
  await s.evaluate(() => {
    document.querySelectorAll('#rg-willkommen, #rg-einladung').forEach(x => x.remove());
  });
};
await seite.goto(`http://localhost:${PORT}/index.html`);
await bereit(seite);

/* ------------------------------------------------------------------------ */
console.log('\n1 · Das Modell rechnet — ohne Uhr, ohne Ablage');

const modell = await seite.evaluate(() => {
  const M = JobModell;
  const T = 1000000;
  const a = M.anlegen('id1', 'test', { x: 1 }, T, '2026-08-31T10:00:00.000Z');

  /* Wartezeit: verdoppelnd ab einer Sekunde, gedeckelt bei fünf Minuten. */
  const warten = [1, 2, 3, 4, 5, 10, 20].map(n => M.wartezeit(n));

  const genommen = M.nehmen(a, T, 'tabA', '2026-08-31T10:00:01.000Z', 30000);
  const zweiter = M.nehmbar(genommen, T + 1000, 'tabB');      /* Pacht gilt */
  const spaeter = M.nehmbar(genommen, T + 40000, 'tabB');     /* Pacht weg  */
  const selbst = M.nehmbar(genommen, T + 1000, 'tabA');       /* ich selbst */

  const s1 = M.schrittFertig(genommen, { seite: 1 }, T + 2000);
  const s2 = M.schrittFertig(s1, { seite: 2 }, T + 3000);

  /* Scheitern: erst wieder wartend, beim dritten Mal endgültig. */
  let f = M.nehmen(a, T, 'tabA', 'z');
  f = M.gescheitert(f, 'kaputt', T, 'z');
  const nachEins = f.zustand;
  f = M.nehmen(f, T, 'tabA', 'z');
  f = M.gescheitert(f, 'kaputt', T, 'z');
  const nachZwei = f.zustand;
  f = M.nehmen(f, T, 'tabA', 'z');
  f = M.gescheitert(f, 'kaputt', T, 'z');
  const nachDrei = f.zustand;

  /* Zurückstellen nach Neustart: nicht sofort, sondern mit Wartezeit. */
  const verwaist = M.zurueckstellen(genommen, T + 40000, 'z');

  return {
    frisch: a.zustand, frischNehmbar: M.nehmbar(a, T, 'tabA'),
    zuFrueh: M.nehmbar({ ...a, nachher: T + 5000 }, T, 'tabA'),
    warten,
    zweiter, spaeter, selbst,
    versuche: genommen.versuche,
    schritt: s2.schritt, stand: (s2.stand as any).seite,
    nachEins, nachZwei, nachDrei,
    fehlerText: f.fehler, fehlerBeendet: !!f.beendet,
    verwaistZustand: verwaist.zustand, verwaistWartet: verwaist.nachher > T + 40000,
    fortschrittOhne: M.fortschritt(a),
    fortschrittMit: M.fortschritt({ ...a, schritt: 3, schritte: 4 }),
    fortschrittFertig: M.fortschritt({ ...a, zustand: 'fertig' }),
    /* Reihenfolge: wer länger wartet, kommt zuerst. */
    reihenfolge: (() => {
      const x = M.anlegen('x', 't', null, T, '2026-08-31T10:00:05.000Z');
      const y = M.anlegen('y', 't', null, T, '2026-08-31T10:00:01.000Z');
      const z = M.anlegen('z', 't', null, T, '2026-08-31T10:00:03.000Z');
      return M.naechster([x, y, z], T, 'tabA').id;
    })(),
    /* Aufräumbar: nur fertig/abgebrochen, und erst nach der Frist. */
    raeumFertig: M.aufraeumbar(
      { zustand: 'fertig', beendet: '2026-08-30T10:00:00.000Z' },
      Date.parse('2026-08-31T10:00:00.000Z'), 3600000),
    raeumFehler: M.aufraeumbar(
      { zustand: 'fehler', beendet: '2026-08-30T10:00:00.000Z' },
      Date.parse('2026-08-31T10:00:00.000Z'), 3600000),
    raeumFrisch: M.aufraeumbar(
      { zustand: 'fertig', beendet: '2026-08-31T09:59:00.000Z' },
      Date.parse('2026-08-31T10:00:00.000Z'), 3600000)
  };
}) as any;

p('Ein frischer Auftrag wartet und ist sofort nehmbar',
  modell.frisch === 'wartet' && modell.frischNehmbar === true);
p('… aber nicht vor seiner Zeit', modell.zuFrueh === false);
p('Die Wartezeit verdoppelt sich und wird bei fünf Minuten gedeckelt',
  modell.warten[0] === 1000 && modell.warten[1] === 2000 && modell.warten[2] === 4000 &&
  modell.warten[6] === 300000, JSON.stringify(modell.warten));
p('Der Versuch wird beim NEHMEN gezählt, nicht beim Scheitern',
  modell.versuche === 1, String(modell.versuche));
p('Ein zweiter Tab bekommt ihn nicht, solange die Pacht gilt',
  modell.zweiter === false);
p('… nach Ablauf der Pacht schon', modell.spaeter === true);
p('… und ich selbst darf ihn immer wieder aufnehmen', modell.selbst === true);
p('Zwei fertige Schritte werden gezählt und ihr Stand bleibt',
  modell.schritt === 2 && modell.stand === 2, JSON.stringify(modell));
p('Erster und zweiter Fehlschlag: er wartet wieder',
  modell.nachEins === 'wartet' && modell.nachZwei === 'wartet');
p('Der dritte ist endgültig — und die Meldung bleibt stehen',
  modell.nachDrei === 'fehler' && modell.fehlerText === 'kaputt' &&
  modell.fehlerBeendet === true, JSON.stringify(modell));
p('Ein verwaister Auftrag wartet wieder, aber NICHT sofort',
  modell.verwaistZustand === 'wartet' && modell.verwaistWartet === true);
p('Ohne bekannte Schrittzahl gibt es keinen erfundenen Fortschritt',
  modell.fortschrittOhne === -1);
p('… mit Schrittzahl schon, und fertig ist 1',
  modell.fortschrittMit === 0.75 && modell.fortschrittFertig === 1);
p('Wer länger wartet, kommt zuerst', modell.reihenfolge === 'y', modell.reihenfolge);
p('Aufgeräumt wird nur Fertiges, und erst nach der Frist',
  modell.raeumFertig === true && modell.raeumFrisch === false);
p('Ein FEHLER wird nie aufgeräumt — das ist der Sinn der Fehlerablage',
  modell.raeumFehler === false);

/* ------------------------------------------------------------------------ */
console.log('\n2 · Das Fach — und was die Sicherung darüber sagt');

/* Gemessen wird BEIDES: ein leeres Auftragsfach lässt nichts aus und darf
   deshalb nichts unter `fehlt` nennen, ein offener Auftrag sehr wohl.
   Der erste Entwurf nannte `auftraege` IMMER — dann könnte eine Sicherung
   eines gewöhnlichen Bestands nie mehr „nichts fehlt" sagen, und ein
   `fehlt`, das immer etwas enthält, bringt Menschen bei, es zu überlesen
   (derselbe Fehler wie die Warnung, die bei gewöhnlichem Gebrauch
   anspringt, E284). Die zweite Hälfte hier ist die Gegenprobe dazu. */
const fach = await seite.evaluate(async () => {
  const faecher = Umzuege.faecher();

  /* Erst der ruhige Fall: kein offener Auftrag. */
  for (const a of (await Store.auftragAlle()) || []) await Store.auftragWeg(a.id);
  await Store.exportVorbereiten();
  const leer = JSON.parse(Store.exportAll());

  /* Dann derselbe Bestand mit EINEM wartenden Auftrag. */
  await Store.auftragPut({ id: 'probe1', art: 'x', zustand: 'wartet' });
  const zurueck = await Store.auftragHolen('probe1');
  await Store.exportVorbereiten();
  const offen = JSON.parse(Store.exportAll());
  await Store.auftragWeg('probe1');

  return {
    inFassungen: faecher.includes('auftraege'),
    fassung: Umzuege.JETZIGE,
    schreibtUndLiest: !!zurueck && zurueck.art === 'x',
    nichtInDaten: leer.auftraege === undefined && offen.auftraege === undefined,
    ruhigNenntNichts: !(leer.fehlt || []).includes('auftraege'),
    offenNennt: (offen.fehlt || []).includes('auftraege'),
    offenImSatz: typeof offen.hinweis === 'string' &&
                 offen.hinweis.includes('offen'),
    ruhigNichtImSatz: typeof leer.hinweis === 'string' &&
                      !leer.hinweis.includes('Auftrag'),
    hinweisDa: typeof leer.hinweis === 'string' && leer.hinweis.length > 10
  };
}) as any;
p('`auftraege` steht in den Ablage-Fassungen', fach.inFassungen === true,
  'Fassung ' + fach.fassung);
p('Das Fach lässt sich beschreiben und wieder lesen', fach.schreibtUndLiest === true);
p('Die Sicherung enthält die Aufträge NICHT — weder leer noch offen',
  fach.nichtInDaten === true);
p('Ohne offenen Auftrag nennt `fehlt` ihn NICHT — sonst wäre `fehlt` nie leer',
  fach.ruhigNenntNichts === true, JSON.stringify(fach));
p('… und der Hinweis erfindet auch keinen', fach.ruhigNichtImSatz === true);
p('GEGENPROBE: mit einem wartenden Auftrag steht er unter `fehlt`',
  fach.offenNennt === true, JSON.stringify(fach));
p('… und der Hinweis sagt im Klartext, dass etwas offensteht',
  fach.offenImSatz === true);

/* ------------------------------------------------------------------------ */
console.log('\n3 · Ein Auftrag läuft durch');

const durchlauf = await seite.evaluate(async () => {
  const ereignisse: string[] = [];
  if (typeof (window as any).Ereignisse !== 'undefined') {
    for (const n of ['auftrag.angelegt', 'auftrag.beginnt', 'auftrag.schritt',
                     'auftrag.beendet']) {
      (window as any).Ereignisse.horche(n, () => ereignisse.push(n));
    }
  }
  Auftraege.anmelden('probe-lauf', async (a: any, h: any) => {
    for (let i = a.schritt; i < 3; i++) {
      await h.schritt({ bis: i + 1 }, 'Schritt ' + (i + 1) + ' von 3');
    }
    return { fertigMit: 3 };
  });
  const a = await Auftraege.anlegen('probe-lauf', { was: 'egal' }, { schritte: 3 });
  /* Warten, bis er durch ist — höchstens fünf Sekunden. */
  for (let i = 0; i < 50; i++) {
    const jetzt = await Auftraege.einer(a.id);
    if (jetzt && JobModell.beendet(jetzt)) break;
    await new Promise(f => setTimeout(f, 100));
  }
  const fertig = await Auftraege.einer(a.id);
  return {
    zustand: fertig.zustand, schritt: fertig.schritt,
    stand: fertig.stand, text: fertig.text,
    begonnen: !!fertig.begonnen, beendet: !!fertig.beendet,
    keinHalter: fertig.geraet === '' && fertig.bisWann === 0,
    ereignisse: ereignisse.join(','),
    arten: Auftraege.arten()
  };
}) as any;
p('Der Auftrag ist fertig', durchlauf.zustand === 'fertig', JSON.stringify(durchlauf));
p('… alle drei Schritte sind gezählt', durchlauf.schritt === 3);
p('… sein Ergebnis steht drin', durchlauf.stand && durchlauf.stand.fertigMit === 3,
  JSON.stringify(durchlauf.stand));
p('… Beginn und Ende sind vermerkt', durchlauf.begonnen && durchlauf.beendet);
p('… und die Pacht ist zurückgegeben', durchlauf.keinHalter === true);
p('… der Satz für den Menschen steht auch da', /Schritt 3 von 3/.test(durchlauf.text || ''),
  durchlauf.text);
p('Der Ereignisbus hat mitgemeldet — angelegt, begonnen, Schritte, beendet',
  /angelegt/.test(durchlauf.ereignisse) && /beginnt/.test(durchlauf.ereignisse) &&
  /schritt/.test(durchlauf.ereignisse) && /beendet/.test(durchlauf.ereignisse),
  durchlauf.ereignisse);
p('`arten()` nennt, was diese Fassung kann (§47)',
  durchlauf.arten.includes('probe-lauf'), JSON.stringify(durchlauf.arten));

/* ------------------------------------------------------------------------ */
console.log('\n4 · DER PUNKT: Neustart mitten in der Arbeit');

/* Ein Läufer, der nach zwei von fünf Schritten HÄNGENBLEIBT. Dann wird die
   Seite neu geladen — so hart, wie ein geschlossener Tab es ist. */
const vorNeustart = await seite.evaluate(async () => {
  Auftraege.anmelden('probe-lang', async (a: any, h: any) => {
    for (let i = a.schritt; i < 5; i++) {
      await h.schritt({ bis: i + 1 }, 'Seite ' + (i + 1));
      if (i + 1 >= 2) {
        /* Ab hier nie wieder zurückkommen — der Tab „stirbt" gleich. */
        await new Promise(() => { /* nie */ });
      }
    }
    return { alle: 5 };
  });
  const a = await Auftraege.anlegen('probe-lang', { seiten: 5 },
    { schritte: 5, id: 'langlaeufer' });
  for (let i = 0; i < 50; i++) {
    const j = await Auftraege.einer(a.id);
    if (j && j.schritt >= 2) break;
    await new Promise(f => setTimeout(f, 100));
  }
  const j = await Auftraege.einer(a.id);
  return { zustand: j.zustand, schritt: j.schritt, haelt: !!j.geraet, bisWann: j.bisWann };
}) as any;
p('Vor dem Neustart: er läuft und hat zwei Schritte fertig',
  vorNeustart.zustand === 'laeuft' && vorNeustart.schritt === 2,
  JSON.stringify(vorNeustart));
p('… und ein Fenster hält die Pacht darauf', vorNeustart.haelt === true);

/* JETZT die Seite wegreissen. */
await seite.reload();
await bereit(seite);

const nachNeustart = await seite.evaluate(async () => {
  /* Der Zustand, BEVOR irgendjemand einen Läufer anmeldet — so sieht ihn
     ein Mensch, der die App gerade wieder aufmacht. */
  const roh = await Auftraege.einer('langlaeufer');
  const vorher = { zustand: roh.zustand, schritt: roh.schritt, versuche: roh.versuche };

  /* Wiederaufnehmen: der Halter ist weg, also darf er zurück in die
     Warteschlange. Die Pacht wird dafür künstlich abgelaufen. */
  await Store.auftragPut({ ...roh, bisWann: 1 });
  const zurueck = await Auftraege.wiederaufnehmen();
  const danach = await Auftraege.einer('langlaeufer');

  /* Und jetzt ein Läufer, der von vorn zählt, ab welchem Schritt er
     wirklich anfängt. */
  let begannBei = -1;
  Auftraege.anmelden('probe-lang', async (a: any, h: any) => {
    begannBei = a.schritt;
    for (let i = a.schritt; i < 5; i++) await h.schritt({ bis: i + 1 }, 'Seite ' + (i + 1));
    return { alle: 5 };
  });
  /* Die Wartezeit überspringen — der Prüflauf soll nicht zwei Sekunden
     schlafen, um eine Regel zu messen, die §1 schon geprüft hat. */
  const w = await Auftraege.einer('langlaeufer');
  await Store.auftragPut({ ...w, nachher: 0 });
  await Auftraege.takten();
  for (let i = 0; i < 60; i++) {
    const j = await Auftraege.einer('langlaeufer');
    if (j && JobModell.beendet(j)) break;
    await new Promise(f => setTimeout(f, 100));
  }
  const fertig = await Auftraege.einer('langlaeufer');
  return {
    vorher, zurueck,
    danachZustand: danach.zustand, danachSchritt: danach.schritt,
    begannBei,
    endZustand: fertig.zustand, endSchritt: fertig.schritt
  };
}) as any;

p('Nach dem Neustart steht der Auftrag noch da — mit seinen zwei Schritten',
  nachNeustart.vorher.zustand === 'laeuft' && nachNeustart.vorher.schritt === 2,
  JSON.stringify(nachNeustart.vorher));
p('Die Wiederaufnahme findet ihn und stellt ihn zurück',
  nachNeustart.zurueck === 1 && nachNeustart.danachZustand === 'wartet',
  JSON.stringify(nachNeustart));
p('… und sein Fortschritt bleibt dabei erhalten', nachNeustart.danachSchritt === 2);
p('DER PUNKT: er beginnt bei Schritt 2 — NICHT von vorn',
  nachNeustart.begannBei === 2,
  'begann bei ' + nachNeustart.begannBei + ' (vor E286 hätte es die Arbeit gar nicht mehr gegeben)');
p('… und läuft dann bis zum Ende durch',
  nachNeustart.endZustand === 'fertig' && nachNeustart.endSchritt === 5,
  JSON.stringify(nachNeustart));

/* ------------------------------------------------------------------------ */
console.log('\n5 · Der Fehler landet in der Ablage und bleibt dort');

const gescheitert = await seite.evaluate(async () => {
  /* JE AUFTRAG zählen, nicht insgesamt: beide Aufträge unten benutzen
     denselben Läufer, und ein gemeinsamer Zähler mass beim ersten Anlauf
     die Summe (4 statt 3). */
  const versuche: Record<string, number> = {};
  Auftraege.anmelden('probe-kaputt', async (a: any) => {
    versuche[a.id] = (versuche[a.id] || 0) + 1;
    throw new Error('geht nicht');
  });

  /* Antreiben, bis er wirklich zu Ende ist. `anlegen` stösst selbst schon
     einen Takt an; ein `await takten()` daneben kehrt sofort zurück, wenn
     jener noch läuft (`laeuftGerade`). Deshalb wird auf den ZUSTAND
     gewartet und nicht auf den Aufruf. */
  const durchtreiben = async (id: string): Promise<any> => {
    for (let n = 0; n < 80; n++) {
      const j = await Auftraege.einer(id);
      if (!j || JobModell.beendet(j)) return j;
      if (j.zustand === 'wartet') {
        await Store.auftragPut({ ...j, nachher: 0 });
        await Auftraege.takten();
      }
      await new Promise(f => setTimeout(f, 50));
    }
    return await Auftraege.einer(id);
  };

  const a = await Auftraege.anlegen('probe-kaputt', {}, { maxVersuche: 3, id: 'kaputt3' });
  const endstand = await durchtreiben(a.id);

  /* Gegenprobe: mit maxVersuche 1 ist nach EINEM Fehlschlag Schluss. */
  const b = await Auftraege.anlegen('probe-kaputt', {}, { maxVersuche: 1, id: 'kaputt1' });
  const kurz = await durchtreiben(b.id);

  /* Und Aufräumen lässt den Fehler LIEGEN. */
  const vorRaeumen = (await Auftraege.alle()).length;
  const geraeumt = await Auftraege.aufraeumen(0);
  const nochDa = await Auftraege.einer(a.id);
  return {
    versuche: versuche['kaputt3'] || 0, zustand: endstand.zustand,
    fehler: endstand.fehler, gezaehlt: endstand.versuche,
    kurzVersucheEcht: versuche['kaputt1'] || 0,
    kurzZustand: kurz.zustand, kurzVersuche: kurz.versuche,
    vorRaeumen, geraeumt, fehlerNochDa: !!nochDa && nochDa.zustand === 'fehler'
  };
}) as any;
p('Er wurde wirklich dreimal versucht', gescheitert.versuche === 3,
  String(gescheitert.versuche));
p('… und steht dann auf `fehler`', gescheitert.zustand === 'fehler',
  JSON.stringify(gescheitert));
p('… mit der Meldung im Klartext', gescheitert.fehler === 'geht nicht',
  gescheitert.fehler);
p('GEGENPROBE: mit `maxVersuche: 1` ist nach EINEM Fehlschlag Schluss',
  gescheitert.kurzZustand === 'fehler' && gescheitert.kurzVersuche === 1 &&
  gescheitert.kurzVersucheEcht === 1, JSON.stringify(gescheitert));
p('Aufräumen lässt den Fehler stehen — er soll gesehen werden',
  gescheitert.fehlerNochDa === true,
  gescheitert.geraeumt + ' von ' + gescheitert.vorRaeumen + ' geräumt');

/* ------------------------------------------------------------------------ */
console.log('\n6 · Zwei Fenster nehmen nicht denselben Auftrag');

const zweite = await ctx.newPage();
zweite.on('pageerror', e => fehler.push('PAGEERROR(2): ' + e.message.slice(0, 140)));
await zweite.goto(`http://localhost:${PORT}/index.html`);
await bereit(zweite);

const doppelt = await seite.evaluate(async () => {
  await Auftraege.anlegen('probe-teilen', { n: 1 }, { id: 'geteilt1' });
  return { id: 'geteilt1', ichA: Auftraege.ICH };
}) as any;

const nehmenA = await seite.evaluate(async () => {
  const g = await Store.auftragNehmen((liste: any[]) => {
    const a = liste.find(x => x.id === 'geteilt1');
    if (!a || !JobModell.nehmbar(a, Date.now(), Auftraege.ICH)) return null;
    return JobModell.nehmen(a, Date.now(), Auftraege.ICH, Store.now());
  });
  return { genommen: !!g, halter: g ? g.geraet : '' };
}) as any;

const nehmenB = await zweite.evaluate(async () => {
  const g = await Store.auftragNehmen((liste: any[]) => {
    const a = liste.find(x => x.id === 'geteilt1');
    if (!a || !JobModell.nehmbar(a, Date.now(), Auftraege.ICH)) return null;
    return JobModell.nehmen(a, Date.now(), Auftraege.ICH, Store.now());
  });
  return { genommen: !!g, ichB: Auftraege.ICH };
}) as any;

p('Die beiden Fenster halten sich für verschieden',
  doppelt.ichA !== nehmenB.ichB, doppelt.ichA + ' / ' + nehmenB.ichB);
p('Das erste bekommt den Auftrag', nehmenA.genommen === true);
p('Das zweite bekommt ihn NICHT — die Pacht gilt',
  nehmenB.genommen === false, JSON.stringify(nehmenB));
p('… und der Halter ist wirklich das erste Fenster',
  nehmenA.halter === doppelt.ichA, nehmenA.halter);

/* ------------------------------------------------------------------------ */
console.log('\n7 · Abbrechen');

const abbruch = await seite.evaluate(async () => {
  /* Wartend: sofort. */
  const w = await Auftraege.anlegen('gibtesnicht', {}, { id: 'abbr1' });
  const ging = await Auftraege.abbrechen(w.id);
  const nachher = await Auftraege.einer(w.id);

  /* Laufend: der Läufer sieht die Marke. */
  let sah = false;
  Auftraege.anmelden('probe-abbruch', async (_a: any, h: any) => {
    for (let i = 0; i < 50; i++) {
      await h.schritt({ i });
      if (h.abgebrochen()) { sah = true; return { abgebrochen: true }; }
      await new Promise(f => setTimeout(f, 20));
    }
    return {};
  });
  const l = await Auftraege.anlegen('probe-abbruch', {}, { id: 'abbr2', schritte: 50 });
  await new Promise(f => setTimeout(f, 200));
  await Auftraege.abbrechen(l.id);
  for (let i = 0; i < 60; i++) {
    const j = await Auftraege.einer(l.id);
    if (j && JobModell.beendet(j)) break;
    await new Promise(f => setTimeout(f, 100));
  }
  const lauf = await Auftraege.einer(l.id);
  /* Ein beendeter lässt sich nicht noch einmal abbrechen. */
  const nochmal = await Auftraege.abbrechen(w.id);
  return {
    ging, wartendZustand: nachher.zustand,
    sah, laufendZustand: lauf.zustand, laufendSchritt: lauf.schritt,
    nochmal
  };
}) as any;
p('Ein wartender Auftrag wird sofort abgebrochen',
  abbruch.ging === true && abbruch.wartendZustand === 'abgebrochen',
  JSON.stringify(abbruch));
p('Ein laufender sieht die Marke bei der nächsten Frage', abbruch.sah === true);
p('… und steht danach auf `abgebrochen`, mit seinem Fortschritt',
  abbruch.laufendZustand === 'abgebrochen' && abbruch.laufendSchritt > 0,
  JSON.stringify(abbruch));
p('Ein beendeter lässt sich nicht noch einmal abbrechen', abbruch.nochmal === false);

/* ------------------------------------------------------------------------ */
console.log('\n8 · Das Ersetzen räumt die Aufträge weg');

const ersetzen = await seite.evaluate(async () => {
  await Auftraege.anlegen('gibtesnicht', { zeigtAuf: 'einen Block' }, { id: 'alt1' });
  await Auftraege.anlegen('gibtesnicht', { zeigtAuf: 'eine Datei' }, { id: 'alt2' });
  const vorher = (await Auftraege.alle()).length;
  const json = Store.exportAll();
  await Store.importAll(json, 'ersetzen');
  const nachher = (await Auftraege.alle()).length;

  /* Gegenprobe: „zusammenfuehren" räumt sie NICHT weg — dort bleiben die
     Blöcke ja auch stehen. */
  await Auftraege.anlegen('gibtesnicht', {}, { id: 'alt3' });
  const vorZusammen = (await Auftraege.alle()).length;
  await Store.importAll(json, 'zusammenfuehren');
  const nachZusammen = (await Auftraege.alle()).length;
  return { vorher, nachher, vorZusammen, nachZusammen };
}) as any;
p('Vor dem Ersetzen liegen Aufträge da', ersetzen.vorher >= 2,
  JSON.stringify(ersetzen));
p('Nach dem Ersetzen ist das Fach leer — sie zeigten ins Nichts',
  ersetzen.nachher === 0, JSON.stringify(ersetzen));
p('GEGENPROBE: Zusammenführen lässt sie stehen',
  ersetzen.nachZusammen === ersetzen.vorZusammen && ersetzen.nachZusammen > 0,
  JSON.stringify(ersetzen));

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | ').slice(0, 250));

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
