/* ============================================================================
 * register/bloecke.js — alle Blockarten an einer Stelle
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/register/bloecke.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/register/bloecke.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Das ist die Datei, in der eine neue Blockart entsteht. Ein Objekt hier,
 * und der Block ist überall da: im Slash-Menü, im Umwandeln-Menü, in der
 * Suche, beim Export, im Markdown-Kürzel.
 *
 * Vorher stand die Liste mitten im Editor. Wer eine Art hinzufügen wollte,
 * musste eine 2700-Zeilen-Datei öffnen und hoffen, dass er die richtige
 * Stelle trifft — und danach an drei weiteren Stellen nachtragen.
 *
 * Ein Eintrag:
 *
 *     id      der Typ, wie er im Block gespeichert wird
 *     name    was der Mensch liest
 *     icon    ein Zeichen, kein Bild — das lädt nicht nach
 *     gruppe  wo er im Slash-Menü steht
 *     cmd     wonach man tippen kann, um ihn zu finden
 *     kurz    Tastenkürzel, falls es eines gibt
 *     md      Markdown-Kürzel: „# " wird zur Überschrift
 *     ph      der graue Text in der leeren Zeile
 *
 * Was hier **nicht** steht: wie der Block gezeichnet wird. Das gehört in den
 * Bereich, der ihn zeichnet. Ein Register beschreibt, es tut nicht.
 * ==========================================================================*/

(window as any).Register = (window as any).Register || {};

Register.bloecke = (() => {

  const EINGEBAUT = [
    /* --- Grundlegende Blöcke ------------------------------------------- */
    { id:'text',    name:'Text',              icon:'¶',  gruppe:'Grundlegend', cmd:['text','absatz','p','plain'],    kurz:'Ctrl+Shift+0', ph:'Tippe etwas, oder drücke / für Befehle' },
    { id:'h1',      name:'Überschrift 1',     icon:'H₁', gruppe:'Grundlegend', cmd:['h1','ueberschrift1','titel','#'], kurz:'Ctrl+Shift+1', md:'#',    ph:'Überschrift 1', stufe:1 },
    { id:'h2',      name:'Überschrift 2',     icon:'H₂', gruppe:'Grundlegend', cmd:['h2','ueberschrift2','##'],      kurz:'Ctrl+Shift+2', md:'##',   ph:'Überschrift 2', stufe:2 },
    { id:'h3',      name:'Überschrift 3',     icon:'H₃', gruppe:'Grundlegend', cmd:['h3','ueberschrift3','###'],     kurz:'Ctrl+Shift+3', md:'###',  ph:'Überschrift 3', stufe:3 },
    { id:'todo',    name:'Aufgabenliste',     icon:'☑',  gruppe:'Grundlegend', cmd:['todo','aufgabe','checkbox'],    kurz:'Ctrl+Shift+4', md:['[]','[ ]','[x]','[X]'], ph:'Aufgabe' },
    { id:'bullet',  name:'Aufzählungsliste',  icon:'•',  gruppe:'Grundlegend', cmd:['bullet','liste','aufzaehlung'], kurz:'Ctrl+Shift+5', md:['-','*','+'], ph:'Listenpunkt' },
    /* Notion nimmt für die nummerierte Liste nicht nur „1." — auch Buchstaben
       und römische Zahlen, mit Punkt oder mit Klammer. Wir hatten nur „1.",
       und `doku/SLASH-UND-TASTEN.md` behauptete trotzdem „a." und „i.". */
    { id:'number',  name:'Nummerierte Liste', icon:'1.', gruppe:'Grundlegend', cmd:['number','nummeriert','num'],    kurz:'Ctrl+Shift+6',
      md:['1.','1)','a.','a)','i.','i)','A.','A)','I.','I)'], ph:'Listenpunkt' },
    { id:'toggle',  name:'Toggle-Liste',      icon:'▸',  gruppe:'Grundlegend', cmd:['toggle','einklappbar'],         kurz:'Ctrl+Shift+7', md:'>',    ph:'Toggle' },
    { id:'toggle-h1', name:'Toggle-Überschrift 1', icon:'▸H₁', gruppe:'Grundlegend', cmd:['toggle h1','einklappbare ueberschrift 1'], stufe:1 },
    { id:'toggle-h2', name:'Toggle-Überschrift 2', icon:'▸H₂', gruppe:'Grundlegend', cmd:['toggle h2','einklappbare ueberschrift 2'], stufe:2 },
    { id:'toggle-h3', name:'Toggle-Überschrift 3', icon:'▸H₃', gruppe:'Grundlegend', cmd:['toggle h3','einklappbare ueberschrift 3'], stufe:3 },
    { id:'quote',   name:'Zitat',             icon:'❝',  gruppe:'Grundlegend', cmd:['quote','zitat'],                md:'"',    ph:'Zitat' },
    { id:'callout', name:'Callout',           icon:'💡', gruppe:'Grundlegend', cmd:['callout','hinweis'],            ph:'Hinweis' },
    { id:'divider', name:'Trennlinie',        icon:'—',  gruppe:'Grundlegend', cmd:['divider','trennlinie','hr','div'], md:['---','***','___'] },

    /* --- Datenbanken ---------------------------------------------------- */
    { id:'db-table',    name:'Tabelle',    icon:'▦', gruppe:'Datenbank', cmd:['tabelle','table','datenbank'] },
    { id:'db-board',    name:'Board',      icon:'▤', gruppe:'Datenbank', cmd:['board','kanban'] },
    { id:'db-list',     name:'Liste',      icon:'☰', gruppe:'Datenbank', cmd:['listenansicht','list'] },
    { id:'db-gallery',  name:'Galerie',    icon:'▩', gruppe:'Datenbank', cmd:['galerie','gallery'] },
    { id:'db-calendar', name:'Kalender',   icon:'📅', gruppe:'Datenbank', cmd:['kalender','calendar'] },

    /* --- Medien ---------------------------------------------------------- */
    { id:'image',    name:'Bild',       icon:'🖼', gruppe:'Medien', cmd:['bild','image','foto'] },
    { id:'video',    name:'Video',      icon:'🎬', gruppe:'Medien', cmd:['video'] },
    { id:'audio',    name:'Audio',      icon:'🔊', gruppe:'Medien', cmd:['audio','ton'] },
    { id:'file',     name:'Datei',      icon:'📎', gruppe:'Medien', cmd:['datei','file','anhang','pdf'] },
    { id:'bookmark', name:'Lesezeichen',icon:'🔖', gruppe:'Medien', cmd:['bookmark','lesezeichen','link','book'] },
    { id:'embed',    name:'Einbetten',  icon:'⧉',  gruppe:'Medien', cmd:['embed','einbetten','iframe'] },

    /* --- Erweitert -------------------------------------------------------- */
    { id:'code',       name:'Code',              icon:'⌨',  gruppe:'Erweitert', cmd:['code'], kurz:'Ctrl+Shift+8', md:'```', ph:'Code' },
    { id:'equation',   name:'Formel',            icon:'∑',  gruppe:'Erweitert', cmd:['formel','equation','math','latex'], kurz:'Ctrl+Shift+E', md:'$$', ph:'E = mc^2' },
    { id:'table',      name:'Einfache Tabelle',  icon:'⊞',  gruppe:'Erweitert', cmd:['tabelle einfach','simple table','raster'] },
    /* Der Tabellenblock rechnet — im Unterschied zur einfachen Tabelle
       darueber, die nur Text in Kaestchen haelt. Deshalb steht er bei den
       Datenbanken und nicht bei den Erweiterungen: wer hier landet, sucht
       eine Rechnung. */
    { id:'spreadsheet', name:'Kalkulationstabelle', icon:'🧮', gruppe:'Datenbank',
      cmd:['kalkulation','spreadsheet','excel','rechnen','tabelle rechnen','summe'] },
    { id:'toc',        name:'Inhaltsverzeichnis',icon:'≡',  gruppe:'Erweitert', cmd:['inhaltsverzeichnis','toc'] },
    { id:'breadcrumb', name:'Pfad',              icon:'⌂',  gruppe:'Erweitert', cmd:['pfad','breadcrumb','bread'] },
    { id:'columns',    name:'Zwei Spalten',      icon:'⫿',  gruppe:'Erweitert', cmd:['spalten','columns'] },
    { id:'columns3',   name:'Drei Spalten',      icon:'⫼',  gruppe:'Erweitert', cmd:['dreispalten','columns3'] },
    { id:'page',       name:'Unterseite',        icon:'📄', gruppe:'Erweitert', cmd:['seite','page','unterseite'], kurz:'Ctrl+Shift+9' },
    { id:'pageref',    name:'Link zu Seite',     icon:'↗',  gruppe:'Erweitert', cmd:['link zu seite','verweis','klon','pageref'] },
    { id:'synced',     name:'Synchronisierter Block', icon:'⇄', gruppe:'Erweitert', cmd:['synced','synchron','spiegel'] },
    { id:'linkeddb',   name:'Verknüpfte Ansicht', icon:'⧉', gruppe:'Datenbank', cmd:['verknuepfte ansicht','linked','ansicht einer datenbank'] },
    { id:'button',     name:'Knopf',             icon:'🔘', gruppe:'Erweitert', cmd:['button','knopf','vorlagenknopf','template'] },
    { id:'html',       name:'HTML',              icon:'</>',gruppe:'Erweitert', cmd:['html'] },

    /* --- Wissen ------------------------------------------------------------ */
    { id:'flashcard',  name:'Karteikarte',       icon:'🎴', gruppe:'Wissen', cmd:['karteikarte','flashcard','lernen'], ph:'Frage :: Antwort' },
    { id:'blatt',      name:'A4-Blatt',          icon:'📄', gruppe:'Wissen', cmd:['blatt','a4','papier','schreiben','malen'] },
    { id:'whiteboard', name:'Whiteboard',        icon:'🖍', gruppe:'Wissen', cmd:['whiteboard','zeichnen','canvas','skizze'] },
    { id:'chart',      name:'Diagramm',          icon:'📊', gruppe:'Wissen', cmd:['diagramm','chart','balken','torte'] },
    { id:'backlinks',  name:'Rückverweise',      icon:'🔙', gruppe:'Wissen', cmd:['rueckverweise','backlinks'] },

    /* --- KI --------------------------------------------------------------- */
    { id:'ai-write',   name:'KI: Text schreiben',    icon:'✨', gruppe:'KI', cmd:['ki','ai','schreiben'] },
    { id:'ai-summary', name:'KI: Zusammenfassen',    icon:'✨', gruppe:'KI', cmd:['zusammenfassen','summary'] },
    { id:'ai-todo',    name:'KI: Aufgaben ableiten', icon:'✨', gruppe:'KI', cmd:['aufgaben','actionitems'] },
    { id:'ai-translate',name:'KI: Übersetzen',       icon:'✨', gruppe:'KI', cmd:['uebersetzen','translate'] },
    { id:'ai-improve', name:'KI: Text verbessern',   icon:'✨', gruppe:'KI', cmd:['verbessern','umschreiben','improve'] },

    /* --- Aktionen -------------------------------------------------------
     * Notions Slash-Menü kann mehr als Blöcke einfügen: es kann den Block
     * auch umwandeln, färben, duplizieren, verschieben und löschen, und es
     * kann Erwähnungen, Daten und Emoji einfügen. Diese Einträge legen
     * nichts an — sie tun etwas. Deshalb tragen sie `aktion`.
     * ------------------------------------------------------------------ */
    { id:'a-turn',    name:'Umwandeln in …',        icon:'⇄', gruppe:'Aktionen', aktion:'turn',
      cmd:['turn','umwandeln','wechseln'] },
    { id:'a-color',   name:'Farbe ändern',          icon:'🎨', gruppe:'Aktionen', aktion:'color',
      cmd:['color','farbe','highlight','hintergrund','blue','blau','rot','red','gruen','green','gelb','yellow'] },
    { id:'a-default', name:'Farbe entfernen',       icon:'▢', gruppe:'Aktionen', aktion:'default',
      cmd:['default','standard','farbe entfernen'] },
    { id:'a-dup',     name:'Block duplizieren',     icon:'⧉', gruppe:'Aktionen', aktion:'dup',
      kurz:'Ctrl+D', cmd:['duplicate','duplizieren','kopieren'] },
    { id:'a-moveto',  name:'Verschieben nach …',    icon:'➦', gruppe:'Aktionen', aktion:'moveto',
      cmd:['moveto','verschieben','move'] },
    { id:'a-del',     name:'Block löschen',         icon:'🗑', gruppe:'Aktionen', aktion:'del',
      kurz:'Entf', cmd:['delete','loeschen','entfernen'] },
    { id:'a-mention', name:'Person oder Seite erwähnen', icon:'@', gruppe:'Aktionen', aktion:'mention',
      kurz:'@', cmd:['mention','erwaehnen','erwaehnung'] },
    { id:'a-date',    name:'Datum einfügen',        icon:'📆', gruppe:'Aktionen', aktion:'date',
      kurz:'@Datum', cmd:['date','datum','heute','today'] },
    { id:'a-remind',  name:'Erinnerung',            icon:'⏰', gruppe:'Aktionen', aktion:'remind',
      kurz:'@remind', cmd:['reminder','remind','erinnerung'] },
    { id:'a-emoji',   name:'Emoji',                 icon:'🙂', gruppe:'Aktionen', aktion:'emoji',
      kurz:':', cmd:['emoji','smiley'] },
    { id:'a-komm',    name:'Kommentar',             icon:'💬', gruppe:'Aktionen', aktion:'komm',
      kurz:'Ctrl+Shift+M', cmd:['comment','kommentar'] }
  ];

  /* Eine Liste, und immer dieselbe.
     Das ist Absicht und wichtig: die Bereiche holen sie sich einmal beim
     Laden. Gäbe alle() jedes Mal eine frische Kopie, wäre eine später
     angemeldete Blockart überall unsichtbar — sie stünde im Register und
     käme trotzdem in keinem Menü an. */
  /**
   * Eine Blockart.
   *
   * `md` ist entweder ein Kürzel oder mehrere — `'#'` für die Überschrift,
   * `['-','*','+']` für die Aufzählung. Beides zuzulassen ist keine
   * Nachlässigkeit: Markdown selbst kennt für manche Blöcke mehrere
   * Schreibweisen, und `zuMarkdown` prüft deshalb auf beides.
   */
  type Blockart = {
    id: string; name: string; icon: string;
    gruppe?: string; cmd?: string[]; kurz?: string;
    md?: string | string[]; ph?: string;
    /* Die Gliederungsstufe einer Überschrift — 1, 2 oder 3.
       Sie stand vorher an ZWEI Stellen: als `TOC_STUFEN` im Editor (mit den
       Toggle-Überschriften) und als Literalliste in `inhaltsflaeche.ts`
       (ohne sie). Eine Seite aus Toggle-Überschriften bekam deshalb im
       Inhaltsverzeichnis Einträge und in der Seitenleiste keine.
       Wer eine neue Überschriftenart anlegt, trägt die Stufe hier ein, und
       beide Stellen sehen sie. */
    stufe?: number;
  };

  const LISTE: Blockart[] = EINGEBAUT.slice();
  const vonAussen = new Set<string>();

  /**
   * Eine neue Blockart anmelden.
   * Gibt `false` zurück, wenn es die id schon gibt — ein Register, das still
   * überschreibt, macht aus einem Tippfehler einen Datenverlust.
   */
  const melde = (eintrag: unknown): boolean => {
    const e = eintrag as Blockart | null;
    if (!e || !e.id) return false;
    if (LISTE.some(x => x.id === e.id)) return false;
    LISTE.push(e);
    vonAussen.add(e.id);
    return true;
  };

  /** Wieder abmelden — für Erweiterungen, die abgeschaltet werden. */
  const nimmZurueck = (id: string): boolean => {
    if (!vonAussen.has(id)) return false;
    const i = LISTE.findIndex(x => x.id === id);
    if (i < 0) return false;
    LISTE.splice(i, 1);
    vonAussen.delete(id);
    return true;
  };

  const alle = (): Blockart[] => LISTE;
  const eines = (id: unknown): Blockart | null => alle().find(x => x.id === id) || null;
  const gruppen = (): string[] =>
    [...new Set(alle().map(x => x.gruppe).filter((g): g is string => !!g))];
  const inGruppe = (g: unknown): Blockart[] => alle().filter(x => x.gruppe === g);

  /**
   * Alle Blockarten, die eine Überschrift sind — mit ihrer Stufe.
   *
   * Eine Antwort für alle, die es wissen müssen: das Inhaltsverzeichnis im
   * Editor, der Gliederungsstreifen der Schale, und was noch kommt.
   */
  const ueberschriften = (): Record<string, number> => {
    const raus: Record<string, number> = {};
    alle().forEach(x => { if (x.stufe) raus[x.id] = x.stufe; });
    return raus;
  };

  /**
   * Ziffer → Blockart, abgeleitet aus dem `kurz`-Feld.
   *
   * Notion legt die zehn häufigsten Blockarten auf Strg+Umschalt+Ziffer.
   * Welche Ziffer welche Art meint, stand bisher DREIMAL im Editor als
   * Literal — einmal für Strg+Umschalt, einmal für die Mac-Belegung
   * Strg+Alt, einmal für die Mehrfachauswahl. Und zusätzlich hier, als
   * `kurz: 'Ctrl+Shift+1'`, wo die Kürzelübersicht es liest.
   *
   * Vier Kopien einer Zuordnung. Wer eine Art auf eine andere Ziffer legt,
   * ändert die Übersicht und lässt drei Griffe stehen — oder umgekehrt,
   * und dann zeigt die Übersicht etwas, das nichts tut.
   *
   * Hier wird sie aus `kurz` GELESEN, nicht danebengeschrieben.
   */
  const zifferZuTyp = (): Record<string, string> => {
    const raus: Record<string, string> = {};
    alle().forEach(x => {
      const m = /^Ctrl\+Shift\+([0-9])$/.exec(String(x.kurz ?? ''));
      if (m && m[1]) raus[m[1]] = x.id;
    });
    return raus;
  };

  /** Welche Art passt zu diesem Markdown-Kürzel? */
  const zuMarkdown = (zeichen: unknown): Blockart | null => alle().find(x => {
    const m = x.md;
    return Array.isArray(m) ? m.some(k => k === zeichen) : m === zeichen;
  }) || null;

  /** Suche fürs Slash-Menü — über Name und alle Kurzwörter. */
  const suche = (text: unknown): Blockart[] => {
    const t = String(text || '').toLowerCase().trim();
    if (!t) return alle();
    return alle().filter(x =>
      (x.name || '').toLowerCase().includes(t) ||
      (x.cmd || []).some(c => c.toLowerCase().startsWith(t)));
  };

  return { alle, eines, gruppen, inGruppe, zuMarkdown, ueberschriften, zifferZuTyp,
           suche, melde, nimmZurueck,
           vonAussen: () => [...vonAussen], anzahl: () => LISTE.length };
})();
