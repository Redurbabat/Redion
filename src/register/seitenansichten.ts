/* ============================================================================
 * register/seitenansichten.ts — der Katalog der drei Blicke auf EINE Seite
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/register/seitenansichten.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/register/seitenansichten.js`; `pruefungen/lauf/test105.mts`
 * meldet es vorher.
 * ----------------------------------------------------------------------------
 * Redur, 26. September 2026, mit einem Bild von AFFiNEs Kopfzeile: „bei der
 * affine haben wir das es wechsel die ansichten und ich will dort auch die
 * beide und plus von unsere aktuelle stand also mit cover usw also dort
 * 3 bereiche" — und danach, als die Frage geklärt war: „ich will die 2 von
 * affine 1:1 haben auch alles komplett wie es aussehn … und noch eine 3 für
 * die aktuelle Redion damit wir es auch haben; die 3 ist von uns erfunden".
 *
 * NACHGELESEN, BEVOR GEBAUT WURDE (`doku/karte/thema-ansichten.md`): AFFiNE
 * hat GENAU ZWEI Modi — `page` und `edgeless` —, und es sind zwei Ansichten
 * DESSELBEN Dokuments, nicht zwei Dokumente. Was oft für einen dritten
 * gehalten wird, ist keiner: Präsentation ist ein Werkzeug der Fläche,
 * Journal eine Eigenschaft, „All docs" eine Liste.
 *
 * WARUM NICHT `Ansichten` UND WARUM NICHT `ansicht`. Beide Namen sind hier
 * längst vergeben, und das ist genau der Fall, vor dem §8 warnt:
 *
 *     `Ansichten`              der Dienst der DATENBANK-Ansichten
 *                              (`bereiche/datenbanken/ansichten/dienst.ts:13`,
 *                              global seit :894)
 *     `Register.ansichten`     der Katalog der zwölf Datenbankansichten
 *     `FORMEN.ansicht`         die Form eines Eintrags im Fach `views`
 *                              (`kern/ablage/formen.ts:119`)
 *
 * Ein zweiter Katalog unter demselben Namen liefe mit dem ersten auseinander,
 * und niemand sähe, welcher gilt. Deshalb `Register.seitenansichten` — und am
 * Block das Feld `seitenAnsicht`, nicht `ansicht`.
 *
 * WAS HIER NICHT STEHT: was eine Ansicht ZEICHNET. Ein Register beschreibt,
 * es zeichnet nicht (`register/formeln.ts`, Z.17). Der Umschalter steht in
 * `schale/aufbau/seitenansicht.ts`, die Leinwand in
 * `schale/aufbau/seitenflaeche.ts`, der Seitenkopf bleibt in `kopfleiste.ts`.
 * ==========================================================================*/

interface Seitenansicht {
  /** Kennung — Datenwort, steht so am Block unter `seitenAnsicht` (§53.3). */
  id: string;
  /** Was im Umschalter steht. Deutsch (§3).
   *  KEINE Kurzform: `Segment` tauscht sie unter 520 px gegen den Namen —
   *  bei „Seite", „Fläche", „Redion" wäre die Kurzform dasselbe Wort, und ein
   *  Tausch, der nichts tauscht, ist eine Zeile, die beim Lesen lügt. */
  name: string;
  /** Der ganze Satz für Titel und Vorleser (§38). */
  titel: string;
  /** Name eines Strichzeichens aus `Register.symbole`. */
  zeichen: string;
  /** Woher die Ansicht kommt — für die Doku, nicht für den Bildschirm. */
  herkunft: 'affine' | 'redion';
}

(window as any).Register = (window as any).Register || {};

Register.seitenansichten = (() => {

  /* Die Reihenfolge ist die des Umschalters, und sie ist AFFiNEs: zuerst die
     Seite, dann die Fläche. Unsere eigene steht hinten — nicht, weil sie
     weniger wert ist, sondern weil die zwei vorderen zusammengehören und ein
     Fremdkörper zwischen ihnen die Ordnung zerschlägt. */
  const ARTEN: Seitenansicht[] = [
    {
      id: 'seite', name: 'Seite',
      titel: 'Seite — schlank wie AFFiNEs `page`: Symbol, Titel, Text. Kein Cover, keine Werkzeugzeile.',
      zeichen: 'page', herkunft: 'affine'
    },
    {
      id: 'flaeche', name: 'Fläche',
      titel: 'Fläche — die Leinwand wie AFFiNEs `edgeless`: Punktraster, der Seitentext als Kasten darauf, schieben und zoomen.',
      zeichen: 'grid', herkunft: 'affine'
    },
    {
      id: 'redion', name: 'Redion',
      titel: 'Redion — unsere eigene: Cover, Symbol, Titel und die Werkzeugzeile. Das, was Redion immer gezeigt hat.',
      zeichen: 'image', herkunft: 'redion'
    }
  ];

  /* ------------------------------------------------------------------------
   * WO EIN BLOCK ERSCHEINT (E691) — AFFiNEs `NoteDisplayMode`, eine Stufe
   * feiner.
   * --------------------------------------------------------------------------
   * Redur, 26. September 2026: „ja mach den vollausbau, jeder block auf die
   * fläche ziehbar." AFFiNE kennt dasselbe Feld, aber an der NOTIZ
   * (`affine/model/src/consts/note.ts:38-42`, Werte `both` | `doc` |
   * `edgeless`); dort ist die Notiz die kleinste Einheit auf der Fläche.
   * Hier ist es der Block — genau das, was Redur gesagt hat.
   *
   * DIE WERTE SIND DATENWÖRTER (§53.3). Sie stehen so am Block und damit in
   * jeder Sicherung; sie zu übersetzen wäre eine Datenmigration.
   *
   * UND DAS FELD HEISST `sichtbarIn`, NICHT `zeigen`. Der erste Entwurf
   * nannte es `zeigen` — und `zeigen` gibt es in dieser App schon 41-mal:
   * als Rückruf `zeigen: () => boolean` an Register-Einträgen
   * (`register/befehle.ts:95`, `navigation.ts:443`, `context.ts:160`,
   * `menueband.ts:851` und weitere). Wer `b.zeigen` liest, hält es für eine
   * Funktion. Dieselbe Kollision hat einen Bogen vorher `ansicht` zu
   * `seitenAnsicht` gemacht (E690, `test573`-Kopf); hier gilt dieselbe
   * Regel — im Zweifel nachsehen, nicht raten (§53.6).
   *
   *     beides    im Text UND auf der Fläche      (die Vorgabe)
   *     seite     nur im Text                      (nicht auf der Fläche)
   *     flaeche   nur auf der Fläche               (AFFiNEs „Hidden on page")
   *
   * UND DAS FEHLEN IST WIEDER DIE VORGABE. Ein Block ohne `zeigen` ist nicht
   * kaputt, sondern von gestern — und steht überall, wo er immer stand.
   * ----------------------------------------------------------------------*/
  const ZEIGEN = ['beides', 'seite', 'flaeche'] as const;
  const ZEIGEN_VORGABE = 'beides';

  /**
   * Erscheint dieser Block in dieser Ansicht?
   *
   * EINE STELLE, NICHT SECHS. Die Frage wird im Text gestellt (zeichnet die
   * Inhaltsfläche ihn?), auf der Fläche (bekommt er einen Kasten?) und in
   * jedem Werkzeug, das beides unterscheidet. Stünde sie mehrfach im Code,
   * liefe sie auseinander — und eine Ansicht zeigte einen Block, den die
   * andere versteckt, ohne dass jemand sagen könnte, welche recht hat (§8).
   *
   * @param block Irgendein Block. `null` zählt als „nein".
   * @param wo    'seite' für jede Textansicht (seite/redion), 'flaeche' für
   *              die Leinwand.
   */
  const zeigtIn = (block: unknown, wo: 'seite' | 'flaeche'): boolean => {
    if (!block || typeof block !== 'object') return false;
    const roh = (block as Record<string, unknown>)['sichtbarIn'];
    const wert = (ZEIGEN as readonly string[]).includes(String(roh))
      ? String(roh) : ZEIGEN_VORGABE;
    return wert === 'beides' || wert === wo;
  };

  /**
   * Ist der Platz eines Blocks auf der Fläche lesbar?
   *
   * WARUM DIE FRAGE HIER STEHT UND NICHT ZWEIMAL DANEBEN. Sie wurde im
   * ersten Entwurf an zwei Stellen beantwortet — in `inhaltsflaeche.ts`
   * („soll er im Seitenkasten stehen?") und in `seitenflaeche.ts` („soll er
   * einen eigenen Kasten bekommen?"). Zwei Fassungen derselben Regel, und
   * der Kommentar gab es selbst zu: „beide müssen dieselbe Antwort geben".
   * Genau davor warnt §8. Antworten sie je verschieden, ist ein Block
   * NIRGENDS — weder im Kasten noch auf der Fläche —, ohne dass etwas
   * gelöscht wurde.
   *
   * UND SIE IST STRENGER ALS AFFiNE. Dort wird ein kaputtes `xywh`
   * abgefangen und still zu `[0,0,0,0]`; die Notiz sitzt danach unsichtbar
   * im Ursprung (`framework/global/src/gfx/xywh.ts:20-29`, nachgelesen).
   * §9 sagt das Gegenteil: kaputte Daten abfangen, statt sie still wirken
   * zu lassen. Ein unlesbarer Platz zählt deshalb als KEIN Platz — der
   * Block bleibt im Text, wo man ihn sieht.
   */
  const ortLesbar = (roh: unknown): boolean => {
    if (!roh || typeof roh !== 'object') return false;
    const o = roh as Record<string, unknown>;
    return Number.isFinite(Number(o['x'])) && Number.isFinite(Number(o['y']));
  };

  /* DIE VORGABE IST DIE UNSERE, UND DAS IST EINE DATENREGEL (§9).
     Ein Seitenblock OHNE das Feld ist nicht kaputt, sondern von gestern — und
     er muss genau das sehen, was er immer gesehen hat. Dasselbe Muster wie
     `raumVersion` beim Whiteboard (E686) und wie `dokumentModus === undefined`
     beim ersten Einlesen einer PDF. Wer diese Zeile auf 'seite' stellt,
     nimmt jeder bestehenden Seite ihr Cover, ohne ein Byte zu ändern. */
  const VORGABE = 'redion';

  const holen = (id: unknown): Seitenansicht | null =>
    ARTEN.find(a => a.id === id) ?? null;

  const ids = (): string[] => ARTEN.map(a => a.id);

  return { ARTEN, VORGABE, ZEIGEN, ZEIGEN_VORGABE, zeigtIn, ortLesbar, holen, ids };
})();
