/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/aktionen.ts (npm run bauen:ts). */
/* ============================================================================
 * register/aktionen.js — was man mit einem Ding tun kann (E721)
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/register/aktionen.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/register/aktionen.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es vorher.
 * ----------------------------------------------------------------------------
 * WOFÜR ES DAS GIBT.
 *
 * Redur, Masterprompt vom 29. September 2026, S. 19: „Hier füge ... und oder
 * beim rechts klicke sollte es mir zeigen löschen" — „für den rechts klick
 * bei eine dokument oder eine text usw wo es passen kann".
 *
 * Ein Ordner, ein Heft, eine PDF, eine Seite: in Redion sind das alles
 * Seiten im Fach `blocks`. Bis hierher hatte dieselbe Seite FÜNF Listen von
 * Aktionen — das Seitenmenü, das ⌄ der Bibliothek, das ⋯ der Notizhefte
 * (Heft und Fach), die Zeile der Datenbank —, jede als HTML-Zeichenkette
 * mit eigener Verdrahtung daneben. „Umbenennen" hiess an einer Stelle „frag
 * nach dem Namen", an der anderen „spring auf die Seite"; „Papierkorb" an
 * einer Stelle `trashBlock`, an der anderen ein rohes `alive:false`. Es gab
 * keinen Ort für DAS EINE Umbenennen (§8).
 *
 * Hier ist dieser Ort. Jede Aktion steht einmal: Name, Zeichen, Gruppe, ob
 * sie gefährlich ist, welche Taste sie trägt, für welches Ding sie gilt und
 * was sie tut. Der Rechtsklick, das sichtbare „…", die Kontextmenü-Taste,
 * Entf und das lange Drücken fragen ALLE hier (`fuer`) und rufen hier
 * (`tun`). Das Seitenmenü behält seinen Aufbau (fünfzig Einträge, Schalter,
 * Schriftkacheln, Tropfen), ruft für dieselben Aktionen aber dieselbe
 * Zeile.
 *
 * WARUM NICHT EIN VORHANDENES REGISTER.
 *
 *   · `Register.befehle` sind Befehle der App — „Neue Seite", „Suche" — mit
 *     `tun()` OHNE Gegenstand. Ein Umbenennen ohne Ding ist keines.
 *   · `Register.kontext` ist die Kante JE BEREICH (die 54-px-Spalte). Sie
 *     fragt „wo bin ich", nicht „was halte ich in der Hand". Beides in eine
 *     Datei zu legen hiesse zwei Kataloge in einem — genau das, was §8
 *     verbietet, nur von der anderen Seite.
 *
 * WER MELDET.
 *
 * Jeder Bereich meldet SEINE Aktionen an (§5 Regel 3), wie bei der Kante:
 * die Schale Öffnen, Merkzeichen, Umbenennen, Symbol, Duplizieren, Link und
 * Papierkorb; das Wissen „Verschieben nach"; die Notizhefte Farbe, Fach,
 * Verschlüsseln; die Bibliothek „Hinein", „Als Seite bearbeiten", „Blick
 * hinein". Niemand greift in einen anderen Bereich (test537). Wer später
 * lädt (E715), meldet später — `fuer()` wird erst beim Öffnen gefragt.
 *
 * EIN KAPUTTER EINTRAG NIMMT NUR SICH SELBST MIT.
 *
 * `fuer()` fängt jeden Fehler aus `gilt()` einzeln ab und lässt dann nur
 * diesen Eintrag weg — dieselbe Regel wie bei `Register.kontext`.
 * ==========================================================================*/

(window as any).Register = (window as any).Register || {};

/** Wo ein Ding gerade angefasst wird. `kontext` ist der Ort
 *  ('bibliothek', 'notizhefte', 'seite'), `art` das, was der Ort über das
 *  Ding weiss ('ordner', 'pdf' …), `anker` das Element, an dem ein
 *  Folge-Menü (Farbe, Symbol) erscheinen soll. */
interface AktionOrt {
  kontext: string;
  art?: string;
  anker?: HTMLElement | null;
  /** Ein Ort, der „hinein" anders meint als die Bibliothek (das Fach der
   *  Notizhefte), reicht hier seinen Weg mit. */
  hinein?: (id: string) => void;
}

/** Eine Aktion, so wie ein Bereich sie anmeldet. */
interface AktionEintrag {
  id: string;
  /** Text der Zeile. Eine Funktion, wenn er vom Ding abhängt
   *  („Zu Favoriten" / „Aus Favoriten"). */
  name: string | ((ding: any, ort: AktionOrt) => string);
  /** Ein Strichzeichen aus `Register.symbole` (E202). */
  zeichen: string;
  /** Zeilen derselben Gruppe stehen beisammen, zwischen den Gruppen eine
   *  Linie. Die Reihenfolge der Gruppen steht in GRUPPEN unten. */
  gruppe: string;
  /** Rot, und immer zuletzt — hinter einer Linie. */
  gefahr?: boolean;
  /** Die Taste, die dieselbe Aktion auf einem fokussierten Ding auslöst
   *  ('Entf'). Wird neben dem Namen angezeigt. */
  taste?: string;
  /** Kleiner steht weiter oben. Ohne Angabe: Reihenfolge der Anmeldung. */
  rang?: number;
  /** Fehlt sie, gilt die Aktion für jede lebende Seite. */
  gilt?: (ding: any, ort: AktionOrt) => boolean;
  tun: (ding: any, ort: AktionOrt) => unknown;
}

/** Was `fuer()` zurückgibt: alles, was ein Menü zum Zeichnen braucht. */
interface AktionZeile {
  id: string;
  name: string;
  zeichen: string;
  gruppe: string;
  gefahr: boolean;
  taste: string;
}

const RegisterAktionen = (() => {
  /** Die Ordnung der Gruppen. Unbekannte Gruppen stehen vor der Gefahr. */
  const GRUPPEN = ['oeffnen', 'merken', 'bearbeiten', 'ablegen', 'teilen'];

  const eintraege: AktionEintrag[] = [];

  const melde = (e: AktionEintrag): void => {
    if (!e || !e.id || typeof e.tun !== 'function') {
      console.warn('Register.aktionen: Eintrag ohne id oder tun abgewiesen', e);
      return;
    }
    const alt = eintraege.findIndex(x => x.id === e.id);
    /* Zweimal dieselbe Kennung ist ein Fehler im Bau, kein Zustand: die
       neuere gewinnt, damit ein neu geladenes Skript sich nicht verdoppelt. */
    if (alt >= 0) eintraege.splice(alt, 1, e); else eintraege.push(e);
  };

  const gilt = (e: AktionEintrag, ding: any, ort: AktionOrt): boolean => {
    if (!ding || ding.alive === false) return false;
    if (!e.gilt) return true;
    try { return !!e.gilt(ding, ort); }
    catch (f) { console.warn('Register.aktionen: gilt() von „' + e.id + '" warf', f); return false; }
  };

  const rangVon = (e: AktionEintrag): number => {
    const g = e.gefahr ? 99 : GRUPPEN.indexOf(e.gruppe);
    return (g < 0 ? GRUPPEN.length : g) * 1000 + (e.rang ?? 500);
  };

  /** Die Aktionen, die für dieses Ding an diesem Ort gelten — geordnet,
   *  die Gefahr zuletzt. */
  const fuer = (ding: any, ort: AktionOrt): AktionZeile[] => {
    const o: AktionOrt = ort || { kontext: '' };
    return eintraege
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => gilt(e, ding, o))
      .sort((a, b) => rangVon(a.e) - rangVon(b.e) || a.i - b.i)
      .map(({ e }) => {
        let name = '';
        try { name = typeof e.name === 'function' ? e.name(ding, o) : e.name; }
        catch { name = e.id; }
        return { id: e.id, name: String(name || e.id), zeichen: e.zeichen || '',
                 gruppe: e.gefahr ? 'gefahr' : e.gruppe, gefahr: !!e.gefahr, taste: e.taste || '' };
      });
  };

  /** Ein Fehler wird gemeldet, nicht verschluckt (§10) — in der Konsole für
   *  den, der sucht, UND als Meldung für den, der geklickt hat. Bis zur
   *  Durchsicht vom 10. Oktober wusste es nur die Konsole: wer „Umbenennen"
   *  wählte und nichts geschah, sah keinen Grund (test597 §17). */
  const scheitern = (e: AktionEintrag, ding: any, o: AktionOrt, f: unknown): void => {
    console.error('Register.aktionen: „' + e.id + '" schlug fehl', f);
    let name = e.id;
    try { name = String((typeof e.name === 'function' ? e.name(ding, o) : e.name) || e.id); }
    catch { /* der Name selbst warf — dann die Kennung */ }
    if (typeof UI !== 'undefined' && UI.toast) UI.toast('„' + name + '“ hat nicht geklappt.');
  };

  /** Eine Aktion ausführen. `false`, wenn es sie nicht gibt oder sie hier
   *  nicht gilt — dann geschieht nichts. Ein Fehler darin wird gemeldet,
   *  nicht verschluckt. */
  const tun = (id: string, ding: any, ort: AktionOrt): boolean => {
    const e = eintraege.find(x => x.id === id);
    const o: AktionOrt = ort || { kontext: '' };
    if (!e || !gilt(e, ding, o)) return false;
    try {
      const r = e.tun(ding, o);
      if (r && typeof (r as Promise<unknown>).catch === 'function')
        (r as Promise<unknown>).catch(f => scheitern(e, ding, o, f));
    } catch (f) {
      scheitern(e, ding, o, f);
      return false;
    }
    return true;
  };

  /** Die Aktion, die eine Taste auf diesem Ding auslöst (Entf → Papierkorb).
   *  Läuft über `tun`, damit es EIN Weg bleibt. */
  const taste = (t: string, ding: any, ort: AktionOrt): boolean => {
    const z = fuer(ding, ort).find(x => x.taste === t);
    return z ? (window as any).Register.aktionen.tun(z.id, ding, ort) : false;
  };

  /** Für Prüfläufe und die Hilfe: was angemeldet ist. */
  const alle = (): string[] => eintraege.map(e => e.id);

  return { melde, fuer, tun, taste, alle, GRUPPEN };
})();

(window as any).Register.aktionen = RegisterAktionen;
