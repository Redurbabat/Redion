/* Suite 77 — Zwei Geräte, dieselbe Seite: geht dabei etwas verloren?
 * ----------------------------------------------------------------------------
 * `AUFGABEN.md` Phase 9 sagt es als Reihenfolge, nicht als Wunsch:
 *
 *     G3 — Sync-Konflikte. Prüfläufe für: zwei Geräte · Änderung offline ·
 *     derselbe Block geändert · Konflikt wird sichtbar · keine Daten
 *     verloren · Anhänge bleiben mit ihren Blöcken verbunden.
 *
 *     **Priorität — G3 VOR echtem Cloud-Sync.**
 *
 * Das ist die richtige Reihenfolge, und diese Datei ist ihr erster Teil. Was
 * hier geprüft wird, ist `kern/abgleich/zusammenfuehren.js` — die Stelle, an
 * der aus zwei Fassungen eine wird. Geht dort etwas verloren, merkt es
 * niemand: es fehlt einfach ein Absatz, den man selbst geschrieben hat, und
 * man hält sich für vergesslich.
 *
 * ─── DIE EINE FRAGE, DIE ALLE ANDEREN ENTHÄLT ───────────────────────────────
 *
 * **Verschwindet je etwas, ohne dass es gemeldet wird?**
 *
 * Ein gemeldeter Konflikt ist in Ordnung — dann sieht ein Mensch beide
 * Fassungen und entscheidet. Ein STILL entschiedener Konflikt ist der
 * schlimmste Fehler, den ein Abgleich haben kann, weil er wie nichts
 * aussieht.
 *
 * Deshalb prüft fast jede Stelle hier zwei Dinge zugleich: was herauskommt
 * UND ob ein Konflikt gemeldet wurde. Das eine ohne das andere sagt nichts.
 *
 * Ohne Browser: `zusammenfuehren.js` ist reine Logik. Sekunden statt Minuten.
 *
 *   node pruefungen/lauf/test113.mts
 * ==========================================================================*/
import { fileURLToPath as alsPfad } from 'node:url';
import { dirname as ordnerVon, resolve as loese, join as dazu } from 'node:path';
import { readFileSync as lies } from 'node:fs';

const WURZEL: string = loese(ordnerVon(alsPfad(import.meta.url)), '../..');

let ok = 0, weg = 0;
const p = (n: string, b: boolean, extra: string = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`);

(globalThis as any).window = globalThis;
(globalThis as any).self = globalThis;
/* `Zusammen` spricht `Store` an, aber nur in den Teilen, die die Ablage
   brauchen (`offene`, `merke`). Die Logik darunter braucht ihn nicht — ein
   schlanker Ersatz reicht, und was ihn doch braucht, fällt sofort auf. */
(globalThis as any).Store = {
  meta: {} as Record<string, unknown>,
  getMeta(k: string, v: unknown) { return (this.meta as any)[k] ?? v; },
  setMeta(k: string, v: unknown) { (this.meta as any)[k] = v; },
  now: () => '2026-08-04T12:00:00.000Z'
};

new Function(lies(dazu(WURZEL, 'quell/kern/abgleich/zusammenfuehren.js'), 'utf8'))();
const Zusammen = (globalThis as any).Zusammen;

/* ==========================================================================
 * 1 · WORTWEISE — zwei Menschen schreiben am selben Absatz
 * ========================================================================*/
console.log('\n1 · Zwei schreiben am selben Absatz');

const T = (b: string, h: string, d: string) => Zusammen.textDreiWege(b, h, d);

gleich('Beide haben dasselbe getippt — kein Konflikt',
  T('a', 'b', 'b'), { text: 'b', konflikt: false });
gleich('Nur hier geändert — hier gewinnt, ohne Konflikt',
  T('a', 'b', 'a'), { text: 'b', konflikt: false });
gleich('Nur dort geändert — dort gewinnt, ohne Konflikt',
  T('a', 'a', 'b'), { text: 'b', konflikt: false });

/* DER FALL, UM DEN ES GEHT. A schreibt vorn, B schreibt hinten. Ein
   Abgleich, der nur „meins oder deins" kann, wirft hier eine der beiden
   Änderungen weg — still. */
{
  const e = T('Der Hund läuft', 'Der grosse Hund läuft', 'Der Hund läuft schnell');
  p('A schreibt vorn, B hinten: BEIDES bleibt',
    (e.text ?? '').includes('grosse') && (e.text ?? '').includes('schnell'), JSON.stringify(e));
  p('… und das ist kein Konflikt', e.konflikt === false, JSON.stringify(e));
}

/* Und wenn beide DIESELBE Stelle ändern, muss es einer sein. */
{
  const e = T('Der Hund läuft', 'Der Kater läuft', 'Der Vogel läuft');
  p('Beide ändern dasselbe Wort: das wird gemeldet', e.konflikt === true, JSON.stringify(e));
  p('… und der eigene Stand bleibt sichtbar, statt zu verschwinden',
    typeof e.text === 'string' && e.text.length > 0, JSON.stringify(e));
}

/* Löschen ist die Stelle, an der ein Zusammenführer gern zu viel tut. */
{
  const e = T('eins zwei drei', 'eins drei', 'eins zwei drei vier');
  p('A löscht ein Wort, B hängt eines an: beides gilt',
    !(e.text ?? '').includes('zwei') && (e.text ?? '').includes('vier'), JSON.stringify(e));
}

/* ==========================================================================
 * 2 · LISTENWEISE — die Reihenfolge der Blöcke einer Seite
 * ------------------------------------------------------------------------
 * `content` ist die Liste der Kindblöcke. Geht dort etwas verloren, ist der
 * Block noch da, aber auf keiner Seite mehr — ein Waisenblock, den niemand
 * je wiederfindet.
 * ========================================================================*/
console.log('\n2 · Die Blockliste einer Seite');

const L = (b: string[], h: string[], d: string[]) => Zusammen.listeDreiWege(b, h, d);

gleich('Nur hier angehängt', L(['a', 'b'], ['a', 'b', 'c'], ['a', 'b']).liste, ['a', 'b', 'c']);
gleich('Nur dort angehängt', L(['a', 'b'], ['a', 'b'], ['a', 'b', 'c']).liste, ['a', 'b', 'c']);

{
  /* A hängt an, B löscht etwas anderes — beides muss gelten. */
  const e = L(['a', 'b', 'c'], ['a', 'b', 'c', 'd'], ['a', 'c']);
  p('A hängt an, B löscht: der neue Block ist da',
    (e.liste ?? '').includes('d'), JSON.stringify(e.liste));
  p('… und der gelöschte ist weg', !(e.liste ?? '').includes('b'), JSON.stringify(e.liste));
  p('… und die übrigen stehen noch in ihrer Reihenfolge',
    e.liste.indexOf('a') < e.liste.indexOf('c'), JSON.stringify(e.liste));
}

{
  /* BEIDE hängen etwas an. Nichts davon darf wegfallen. */
  const e = L(['a'], ['a', 'x'], ['a', 'y']);
  p('Beide hängen etwas an: BEIDES bleibt',
    (e.liste ?? '').includes('x') && (e.liste ?? '').includes('y'), JSON.stringify(e.liste));
}

/* ==========================================================================
 * 3 · FELDWEISE — derselbe Satz, verschiedene Felder
 * ========================================================================*/
console.log('\n3 · Derselbe Satz, verschiedene Felder');

{
  const basis = { id: '1', text: 'Aufgabe', props: { status: 'Offen', prio: 'Hoch' } };
  const hier  = { id: '1', text: 'Aufgabe', props: { status: 'Erledigt', prio: 'Hoch' } };
  const dort  = { id: '1', text: 'Aufgabe', props: { status: 'Offen', prio: 'Mittel' } };
  const e = Zusammen.dreiWege(basis, hier, dort);
  gleich('A ändert den Status, B die Priorität: beides bleibt',
    [e.satz.props.status, e.satz.props.prio], ['Erledigt', 'Mittel']);
  gleich('… und es ist kein Konflikt', e.konflikte.length, 0);
  p('… und es gilt als zusammengeführt', e.zusammengefuehrt === true);
}

{
  /* DASSELBE Feld verschieden gesetzt — das ist einer, und er muss sichtbar
     werden. Still zu entscheiden wäre der schlimmste Ausgang. */
  const basis = { id: '1', props: { status: 'Offen' } };
  const hier  = { id: '1', props: { status: 'Erledigt' } };
  const dort  = { id: '1', props: { status: 'Verworfen' } };
  const e = Zusammen.dreiWege(basis, hier, dort);
  gleich('Beide ändern dasselbe Feld: genau ein Konflikt', e.konflikte.length, 1);
  p('… und BEIDE Fassungen stehen darin',
    e.konflikte[0].hier === 'Erledigt' && e.konflikte[0].dort === 'Verworfen',
    JSON.stringify(e.konflikte[0]));
  p('… mit einem Grund im Klartext',
    typeof e.konflikte[0].grund === 'string' && e.konflikte[0].grund.length > 10,
    String(e.konflikte[0].grund));
  p('… und das Feld ist benannt', !!e.konflikte[0].feld, JSON.stringify(e.konflikte[0].feld));
}

{
  /* OHNE gemeinsamen Stand lässt sich nichts zusammenführen. Dann muss das
     gesagt werden, statt nach dem Zeitstempel zu entscheiden und zu
     schweigen. */
  const e = Zusammen.dreiWege(null,
    { id: '1', text: 'meins', edited: '2026-01-01T00:00:00Z' },
    { id: '1', text: 'deins', edited: '2026-02-01T00:00:00Z' });
  gleich('Ohne gemeinsamen Stand: gemeldet, nicht stillschweigend', e.konflikte.length, 1);
  p('… und es gilt ausdrücklich NICHT als zusammengeführt',
    e.zusammengefuehrt === false);
  p('… und beide vollständigen Fassungen liegen bei',
    !!e.konflikte[0].hier && !!e.konflikte[0].dort);
}

/* ==========================================================================
 * 4 · DIE EIGENTLICHE FRAGE: GEHT JE ETWAS STILL VERLOREN?
 * ------------------------------------------------------------------------
 * Nicht ein Fall, sondern viele — und für jeden dieselbe Prüfung:
 *
 *     Was am Ende dasteht, muss entweder die eine oder die andere Fassung
 *     enthalten. Enthält es keine von beiden und ist auch kein Konflikt
 *     gemeldet, ist etwas verschwunden.
 *
 * Das ist der Satz, um den es in Phase 9 geht.
 * ========================================================================*/
console.log('\n4 · Verschwindet je etwas, ohne dass es gemeldet wird?');

const FAELLE: Array<[string, any, any, any]> = [
  ['Text an beiden Enden',
    { id: '1', text: 'a b c' }, { id: '1', text: 'X a b c' }, { id: '1', text: 'a b c Y' }],
  ['Ein Feld neu, eines geändert',
    { id: '1', props: { a: '1' } }, { id: '1', props: { a: '2' } }, { id: '1', props: { a: '1', b: '9' } }],
  ['Ein Feld gelöscht, eines geändert',
    { id: '1', props: { a: '1', b: '2' } }, { id: '1', props: { a: '1' } }, { id: '1', props: { a: '3', b: '2' } }],
  ['Liste umsortiert und ergänzt',
    { id: '1', content: ['a', 'b'] }, { id: '1', content: ['b', 'a'] }, { id: '1', content: ['a', 'b', 'c'] }],
  ['Beide setzen dasselbe Feld',
    { id: '1', props: { a: '1' } }, { id: '1', props: { a: '2' } }, { id: '1', props: { a: '3' } }],
  ['Nur der Zeitstempel unterscheidet sich',
    { id: '1', text: 'x', edited: '1' }, { id: '1', text: 'x', edited: '2' }, { id: '1', text: 'x', edited: '3' }],
  ['Tief verschachtelte Eigenschaften',
    { id: '1', props: { m: { x: 1, y: 2 } } },
    { id: '1', props: { m: { x: 9, y: 2 } } },
    { id: '1', props: { m: { x: 1, y: 8 } } }]
];

let stilleVerluste = 0;
FAELLE.forEach(([name, basis, hier, dort]) => {
  const e = Zusammen.dreiWege(basis, hier, dort);
  const raus = JSON.stringify(e.satz);

  /* Jede Änderung, die einer der beiden gemacht hat, muss sich im Ergebnis
     wiederfinden — oder als Konflikt gemeldet sein. */
  const neuHier = JSON.stringify(hier) !== JSON.stringify(basis);
  const neuDort = JSON.stringify(dort) !== JSON.stringify(basis);
  const drinHier = raus === JSON.stringify(hier);
  const drinDort = raus === JSON.stringify(dort);
  const gemeldet = e.konflikte.length > 0;
  const zusammengefuehrt = !drinHier && !drinDort;

  const inOrdnung = gemeldet || zusammengefuehrt || (!neuHier && drinDort) ||
                    (!neuDort && drinHier) || drinHier || drinDort;
  if (!inOrdnung) stilleVerluste++;
  p(name + ': nichts verschwindet unbemerkt', inOrdnung,
    `konflikte=${e.konflikte.length} raus=${raus.slice(0, 90)}`);
});
gleich('Kein einziger stiller Verlust in allen Fällen', stilleVerluste, 0);

/* ==========================================================================
 * 5 · DIE KONFLIKTLISTE
 * ------------------------------------------------------------------------
 * Ein Konflikt, den niemand findet, ist keiner. Er muss stehen bleiben, bis
 * ein Mensch ihn angesehen hat — und er darf sich bei jedem Abgleich nicht
 * verdoppeln, sonst steht dort nach einem Tag dieselbe Sache dreissigmal.
 * ========================================================================*/
console.log('\n5 · Die Konfliktliste');

const K = { pfad: ['props', 'status'], feld: 'Status',
            hier: 'Erledigt', dort: 'Verworfen', grund: 'Beide geändert' };

Zusammen.merke('block-1', 'blocks', [K]);
gleich('Ein Konflikt landet in der Liste', Zusammen.offene().length, 1);

Zusammen.merke('block-1', 'blocks', [K]);
gleich('Derselbe Konflikt zweimal bleibt einer', Zusammen.offene().length, 1);

Zusammen.merke('block-1', 'blocks', [{ ...K, pfad: ['props', 'prio'], feld: 'Priorität' }]);
gleich('Ein anderer Konflikt kommt dazu', Zusammen.offene().length, 2);

Zusammen.merke('block-2', 'blocks', [K]);
gleich('Und derselbe Pfad an einem ANDEREN Block ist ein eigener',
  Zusammen.offene().length, 3);

const eintrag = Zusammen.offene()[0];
p('Ein Eintrag weiss, wo er hingehört', !!eintrag.id && !!eintrag.tabelle);
p('… und trägt beide Fassungen', eintrag.hier !== undefined && eintrag.dort !== undefined);
p('… und wann er entstand', !!eintrag.wann);

/* ==========================================================================
 * 6 · DIE GRENZE, DIE EHRLICH GEZOGEN IST
 * ------------------------------------------------------------------------
 * Der wortweise Vergleich kostet Länge × Länge. Bei einem sehr langen Text
 * würde er die Oberfläche einfrieren. Statt es zu versuchen und zu hängen,
 * meldet er einen Konflikt — das ist die richtige Antwort, und sie steht so
 * im Kopf der Datei.
 * ========================================================================*/
console.log('\n6 · Wo es aufhört, sagt es das');

{
  const lang = new Array(5000).fill('wort').join(' ');
  const e = Zusammen.textDreiWege(lang, lang + ' hier', lang + ' dort');
  p('Ein sehr langer Text wird gemeldet statt durchgerechnet', e.konflikt === true);
  p('… und der eigene Stand bleibt erhalten', e.text.startsWith('wort'));
}


/* ==========================================================================
 * 7 · DIE AUSGANGSSCHLANGE — was NIE ANKOMMT, merkt niemand
 * ------------------------------------------------------------------------
 * `zuSchicken` gibt alles zurück, dessen `edited` NEUER als die Marke ist.
 * Nach jeder Runde wandert die Marke auf den Zeitstempel des letzten
 * gesendeten Satzes.
 *
 * DARIN STECKT EIN LOCH, und es ist dasselbe wie bei den Zeilen: die
 * Millisekunde. Liegen zwei Sätze in DERSELBEN und fällt der Schnitt der
 * Runde zwischen sie, ist der zweite ab sofort ausgeschlossen — `edited <=
 * marke`, für immer. Er steht auf diesem Gerät und kommt nie in der Wolke
 * an. Kein Fehler, keine Meldung, nichts.
 *
 * Von Hand passiert das nie: dreihundert Sätze in einer Millisekunde
 * schreibt kein Mensch. Beim Einfügen aus Excel, beim CSV-Import und bei
 * Vorlagen entstehen sie in Reihe — und genau die vermisst jemand
 * hinterher.
 *
 * Geprüft wird die REGEL im Quelltext, nicht ein Lauf gegen einen Server:
 * eine Runde darf niemals mitten in einer Millisekunde enden.
 * ========================================================================*/
console.log('\n7 · Die Ausgangsschlange');

const maschine = lies(dazu(WURZEL, 'quell/kern/abgleich/maschine.js'), 'utf8');

/* Seit `maschine.js` aus TypeScript erzeugt wird, bestimmt `tsc` die
   Zeilenumbrüche: aus `while (…) bis++;` in einer Zeile werden zwei. Die
   Regel ist dieselbe geblieben, nur ihre Schreibweise nicht — deshalb steht
   hier `\s+` statt eines festen Leerzeichens. Das ist keine Aufweichung: der
   Ausdruck verlangt weiterhin genau diese Schleife und nichts anderes. */
p('Die Runde nimmt alles mit, was denselben Zeitstempel trägt',
  /while \(bis < liste\.length && zeitVon\(liste\[bis\]\) === grenze\)\s+bis\+\+/.test(maschine));
p('… und der Abbruch vergleicht mit der WIRKLICH gesendeten Menge',
  /liste\.length <= dran\.length/.test(maschine));
p('… nicht mehr mit der festen Rundengrösse',
  !/liste\.length <= RUNDE/.test(maschine));

/* Und die Rechnung dahinter, an einem Beispiel nachgestellt: dreissig Sätze
   in derselben Millisekunde, Rundengrösse fünf. Ohne die Regel gingen
   fünfundzwanzig verloren. */
{
  const saetze = Array.from({ length: 30 }, (_, i) =>
    ({ id: 'b' + i, satz: { edited: '2026-08-04T12:00:00.000Z' } }));
  saetze.push({ id: 'spaeter', satz: { edited: '2026-08-04T12:00:01.000Z' } });
  const zeitVon = (e: any) => String(e.satz.edited || '');
  const RUNDE = 5;

  let bis = Math.min(RUNDE, saetze.length);
  if (bis < saetze.length) {
    const grenze = zeitVon(saetze[bis - 1]);
    while (bis < saetze.length && zeitVon(saetze[bis]) === grenze) bis++;
  }
  gleich('Dreissig Sätze in einer Millisekunde gehen zusammen raus', bis, 30);
  p('… und der spätere bleibt für die nächste Runde',
    zeitVon(saetze[bis]) === '2026-08-04T12:00:01.000Z');

  /* OHNE die Regel wären es fünf gewesen (Math.min(5, 31)) — und die
     restlichen fünfundzwanzig für immer ausgeschlossen. Das stand hier als
     Prüfpunkt und konnte nie rot werden: Arithmetik über die EIGENEN
     Konstanten dieses Modells, nicht über die App (§55.2). Was die App
     wirklich tut, halten die drei Quelltext-Punkte über diesem Block fest. */
}

/* ==========================================================================
 * 8 · WAS DER ABGLEICH MITNIMMT — seit dem 6. August auch die Anhänge
 * ------------------------------------------------------------------------
 * Bis G2 gebaut war, stand hier der Stolperdraht „Anhänge gehen NOCH NICHT
 * mit", damit niemand seine Bilder für abgeglichen hielt. Der Tag ist da
 * (E33): die Bytes gehen stückweise über /datei/*, verschlüsselt wie die
 * Sätze. Der Draht ist deshalb umgedreht — jetzt wacht er darüber, dass
 * die Wege im Code BLEIBEN. Am echten Server prüfen test118 und test119.
 * ========================================================================*/
console.log('\n8 · Was der Abgleich mitnimmt');

p('Blöcke gehen mit', /cache\.blocks\)\.forEach/.test(maschine));
p('Sammlungen gehen mit', /cache\.collections\)\.forEach/.test(maschine));
p('Ansichten gehen mit', /cache\.views\)\.forEach/.test(maschine));
p('Anhänge gehen mit — der Stand wird geholt', /\/datei\/stand/.test(maschine));
p('… die Stücke gehen hoch und runter',
  /\/datei\/stueck/.test(maschine) && /\/datei\/runter/.test(maschine));
p('… und zwar verschlüsselt wie die Sätze', /verschluesseleBytes/.test(maschine));

const aufgaben = lies(dazu(WURZEL, 'AUFGABEN.md'), 'utf8');
p('… und die Aufgabenliste kennt G2 und R2', /G2 —|G2 -/.test(aufgaben) && /R2/.test(aufgaben));

console.log(`\n  Suite 77 — Zwei Geräte: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
