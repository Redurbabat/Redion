/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/ki.ts (npm run bauen:ts). */
/* ============================================================================
 * register/ki.ts — der EINE Katalog der KI-Befehle (E724)
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/register/ki.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/register/ki.js`; `pruefungen/lauf/test105.mts` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Redur, PDF vom 29. September, am Foto des KI-Fensters: „hier beim ki sollte
 * alles komplet was beim werkzeuge undkontext seteh dort integriert sein also
 * im passenden ortern du muss entscheiden was wo kommt und warum ." Und der
 * Masterprompt: „Wenn ein Eintrag mehrfach sinnvoll ist, eine gemeinsame
 * Datenquelle/Command-Registry verwenden statt Kopien."
 *
 * WARUM DAS HIER ANFÄNGT. Vor E724 gab es FÜNF Kataloge für dieselben
 * Aufträge (gemessen, messungen §93): fünf `data-p`-Knöpfe in `index.html`,
 * 16 `SCHREIB_BEFEHLE`, vier `FAEHIG_START`, sechs Aufträge in `blockAktion`
 * und vier Abschriften in der Palette (`wissen/werkzeuge.ts`). „Zusammen-
 * fassen" schickte je nach Weg drei verschiedene Anweisungen; „Korrektur-
 * lesen" mit Markierung schickte nur die Anweisung, nicht den Text. Kein
 * Eintrag sagte, WORAUF er wirkt — deshalb konnte das Fenster eine Aktion
 * nicht dorthin stellen, wo ihr Ziel ist, und die Schublade „Werkzeuge &
 * Kontext" wurde der Ort für alle.
 *
 * WAS EIN EINTRAG SAGT: worauf er wirkt (`ziel`), was er verlangt (`auftrag`,
 * EINE Fassung je Kennung) und wohin das Ergebnis geht (`ausgabe`). Der
 * Läufer in `bereiche/ki/dienst.ts` liest genau das — die Eingabe folgt dem
 * Ziel, die Knöpfe unter der Antwort folgen der Ausgabe.
 *
 * WAS HIER NICHT STEHT: was ein Werkzeug TUT. Ein Register beschreibt, es
 * zeichnet nicht (`register/werkzeuge.ts`). Die vier Werkzeuge (`art:
 * 'werkzeug'`) führt die KI selbst aus; hier steht nur, dass es sie gibt.
 *
 * WARUM EIN DRITTES REGISTER neben `Register.befehle` (die Palette) und
 * `Register.aktionen` (die Objektaktionen, E721): ein KI-Befehl ist keine
 * Aktion an einem Objekt, sondern ein Auftrag mit Ziel und Ausgabe. Die
 * Palette bekommt die häufigen davon über einen Lieferanten (die KI meldet
 * ihn an) — sie kopiert nichts. Die Alternative war der Katalog in
 * `ki/dienst.ts`: dann hätten Editor und Wissen weiter die KI beim Namen
 * rufen müssen, um zu erfahren, welche Befehle es gibt (§5 Regel 1).
 *
 * DIE KENNUNGEN SIND DATENWÖRTER. Die eingebauten Fähigkeiten (`stil`,
 * `korrek`, `erklaer`, `format`) stehen so in `meta` unter `kiFaehigkeiten`
 * jedes Geräts, das sie je gespeichert hat. `alt.faehig` verweist darauf —
 * die Daten bleiben, wie sie sind (§53.3).
 * ==========================================================================*/

/** Worauf ein Befehl wirkt. */
type KiZiel = 'markierung' | 'block' | 'seite' | 'datenbank' | 'chat';
/** Wohin das Ergebnis geht. */
type KiAusgabe = 'ersetzen' | 'darunter' | 'karteikarten' | 'neueSeite' | 'chat';

interface KiBefehl {
  /** Kennung — Datenwort (steht in `data-ki`, `data-sb` und im Chat). */
  id: string;
  /** Der Name, den ein Mensch liest. */
  name: string;
  /** Ein Zeichen für Menüs (Text, kein SVG — Menüs schreiben Text). */
  icon: string;
  /** `auftrag` läuft durch den Läufer; `werkzeug` führt die KI selbst aus. */
  art: 'auftrag' | 'werkzeug';
  /** Gruppe im Befehlsmenü. */
  gruppe: 'Schreiben und bearbeiten' | 'Bauen und nachschlagen';
  ziel: KiZiel;
  /** Die EINE Anweisung. `{sprache}` wird nach der Rückfrage eingesetzt. */
  auftrag: string;
  ausgabe: KiAusgabe;
  /** Rückfrage vor dem Lauf (Übersetzen, Datenbank bauen …). */
  frage?: string;
  /** Vorgabe der Rückfrage. */
  vorgabe?: string;
  /** In der Palette (Strg K) — mit diesem Titel, sonst „KI: name". */
  haeufig?: boolean;
  palette?: string;
  /** Die alten Kennungen, damit alte Wege und Prüfläufe weiter treffen. */
  alt?: { sb?: string; faehig?: string; block?: string[] };
}

(window as any).Register = (window as any).Register || {};

Register.ki = (() => {
  const S = 'Schreiben und bearbeiten' as const;
  const B = 'Bauen und nachschlagen' as const;

  const BEFEHLE: KiBefehl[] = [
    /* — Für die Seite (die Knöpfe im leeren Chat) — */
    { id: 'zusammenfassen', name: 'Zusammenfassen', icon: '📋', art: 'auftrag', gruppe: S,
      ziel: 'seite', ausgabe: 'darunter', haeufig: true,
      /* Die genaueste der drei Fassungen (vorher blockAktion): sie sagt,
         WAS hervorzuheben ist. Die Knopf-Fassung („in fünf Stichpunkten")
         und die Schreib-Fassung („höchstens fünf") sind darin enthalten. */
      auftrag: 'Fasse den Text in höchstens fünf kurzen Stichpunkten zusammen. ' +
               'Hebe Entscheidungen, offene Fragen und nächste Schritte hervor.',
      alt: { sb: 'fassen', block: ['ai-summary'] } },
    { id: 'aufgaben', name: 'Aufgaben ableiten', icon: '☑', art: 'auftrag', gruppe: S,
      ziel: 'seite', ausgabe: 'darunter', haeufig: true,
      auftrag: 'Leite aus dem Text konkrete Aufgaben ab. Jede Aufgabe als eigene Zeile, ' +
               'beginnend mit einem Verb.',
      alt: { block: ['ai-todo'] } },
    { id: 'besser', name: 'Text verbessern', icon: '✨', art: 'auftrag', gruppe: S,
      ziel: 'markierung', ausgabe: 'ersetzen',
      /* Fünf Wege hiessen „Umschreiben", „Text verbessern", „Schreibstil
         verbessern", ai-edit und ai-improve — eine Fassung für alle. */
      auftrag: 'Formuliere den Text klarer und flüssiger, ohne den Sinn zu ändern.',
      alt: { faehig: 'stil', block: ['ai-edit', 'ai-improve'] } },
    { id: 'uebersetzen', name: 'Übersetzen', icon: '🌍', art: 'auftrag', gruppe: S,
      ziel: 'markierung', ausgabe: 'ersetzen', haeufig: true,
      /* Fragt IMMER nach der Sprache (vorher übersetzte der Knopf nur ins
         Englische, „Schreiben → Übersetzen" fragte). Vorgabe Englisch. */
      auftrag: 'Übersetze den Text in diese Sprache: {sprache}. Gib nur die Übersetzung zurück.',
      frage: 'In welche Sprache?', vorgabe: 'Englisch',
      alt: { block: ['ai-translate'] } },
    { id: 'karteikarten', name: 'Karteikarten', icon: '🗂', art: 'auftrag', gruppe: S,
      ziel: 'seite', ausgabe: 'karteikarten',
      auftrag: 'Mache aus dem Text Karteikarten. Je Zeile genau eine Karte: Frage :: Antwort. ' +
               'Keine Nummerierung, keine Einleitung.' },
    { id: 'schreiben', name: 'Text schreiben', icon: '✒️', art: 'auftrag', gruppe: S,
      ziel: 'block', ausgabe: 'darunter',
      auftrag: 'Schreibe einen zusammenhängenden Absatz zu diesem Stichwort.',
      alt: { block: ['ai-write'] } },
    /* — Schreiben und bearbeiten (vorher SCHREIB_BEFEHLE) — */
    { id: 'weiter', name: 'Weiterschreiben', icon: '✒️', art: 'auftrag', gruppe: S,
      ziel: 'markierung', ausgabe: 'darunter',
      auftrag: 'Schreib den Text sinnvoll weiter. Gleiche Stimme, gleicher Ton, keine Wiederholung.' },
    { id: 'kuerzer', name: 'Kürzer machen', icon: '✂️', art: 'auftrag', gruppe: S,
      ziel: 'markierung', ausgabe: 'ersetzen',
      auftrag: 'Kürze den Text auf das Wesentliche. Höchstens die Hälfte.' },
    { id: 'laenger', name: 'Länger machen', icon: '📏', art: 'auftrag', gruppe: S,
      ziel: 'markierung', ausgabe: 'ersetzen',
      auftrag: 'Führe den Text weiter aus, mit Beispielen. Nichts erfinden, was widerspricht.' },
    { id: 'einfach', name: 'Einfacher erklären', icon: '💡', art: 'auftrag', gruppe: S,
      ziel: 'markierung', ausgabe: 'darunter',
      auftrag: 'Erkläre denselben Inhalt einfach und verständlich, ohne Fachjargon — so, ' +
               'dass ihn jemand ohne Vorwissen versteht.',
      alt: { faehig: 'erklaer' } },
    { id: 'ton-formell', name: 'Ton: förmlich', icon: '🎩', art: 'auftrag', gruppe: S,
      ziel: 'markierung', ausgabe: 'ersetzen',
      auftrag: 'Schreib den Text förmlich und sachlich um, in der Sie-Form.' },
    { id: 'ton-locker', name: 'Ton: locker', icon: '😊', art: 'auftrag', gruppe: S,
      ziel: 'markierung', ausgabe: 'ersetzen',
      auftrag: 'Schreib den Text locker und freundlich um, in der Du-Form.' },
    { id: 'ton-direkt', name: 'Ton: direkt', icon: '🎯', art: 'auftrag', gruppe: S,
      ziel: 'markierung', ausgabe: 'ersetzen',
      auftrag: 'Schreib den Text kurz und direkt um. Keine Höflichkeitsfloskeln.' },
    { id: 'recht', name: 'Rechtschreibung', icon: '📝', art: 'auftrag', gruppe: S,
      ziel: 'markierung', ausgabe: 'ersetzen',
      auftrag: 'Korrigiere Rechtschreibung, Grammatik und Zeichensetzung. Ändere sonst nichts.',
      alt: { faehig: 'korrek' } },
    { id: 'ideen', name: 'Ideen sammeln', icon: '💡', art: 'auftrag', gruppe: S,
      ziel: 'markierung', ausgabe: 'darunter',
      auftrag: 'Sammle zehn Ideen zum Thema. Je Zeile eine, ohne Nummerierung.' },
    { id: 'gliedern', name: 'Gliederung bauen', icon: '🗂', art: 'auftrag', gruppe: S,
      ziel: 'markierung', ausgabe: 'ersetzen',
      auftrag: 'Gliedere den Text sauber mit Überschriften und Stichpunkten. Der Inhalt bleibt.',
      alt: { faehig: 'format' } },
    { id: 'tabelle', name: 'Tabelle daraus machen', icon: '▦', art: 'auftrag', gruppe: S,
      ziel: 'markierung', ausgabe: 'darunter',
      auftrag: 'Mach aus dem Text eine Tabelle. Antworte als Markdown-Tabelle mit Kopfzeile.' },
    { id: 'fragen', name: 'Rückfragen finden', icon: '❓', art: 'auftrag', gruppe: S,
      ziel: 'markierung', ausgabe: 'darunter',
      auftrag: 'Nenne fünf Fragen, die dieser Text offen lässt.' },
    /* — Werkzeuge, die die KI selbst ausführt — */
    { id: 'datenbank', name: 'Datenbank bauen', icon: '▦', art: 'werkzeug', gruppe: B,
      ziel: 'datenbank', ausgabe: 'chat', haeufig: true, palette: 'Datenbank von der KI bauen lassen',
      auftrag: '', frage: 'Was soll die Datenbank können?',
      vorgabe: 'Aufgaben mit Status, Priorität, Fälligkeit und Aufwand' },
    { id: 'seite', name: 'Seite aufbauen', icon: '📄', art: 'werkzeug', gruppe: B,
      ziel: 'seite', ausgabe: 'chat', haeufig: true, palette: 'Seitenaufbau von der KI',
      auftrag: '', frage: 'Worum geht es auf der Seite?', vorgabe: '' },
    { id: 'nachschlagen', name: 'Bei Wikipedia nachschlagen', icon: '📖', art: 'werkzeug', gruppe: B,
      ziel: 'chat', ausgabe: 'chat', haeufig: true, palette: 'Nachschlagen bei Wikipedia',
      auftrag: '', frage: 'Was soll ich nachschlagen?' },
    { id: 'protokoll', name: 'Protokoll: was die KI gebaut hat', icon: '🕘', art: 'werkzeug', gruppe: B,
      ziel: 'chat', ausgabe: 'chat', haeufig: true, palette: 'Protokoll: was die KI gebaut hat',
      auftrag: '' }
  ];

  const finde = (id: unknown): KiBefehl | undefined => BEFEHLE.find(b => b.id === id);
  const alle = (): KiBefehl[] => BEFEHLE.slice();
  /** Der Eintrag zu einer alten Kennung — `ausAlt('block', 'ai-edit')`. */
  const ausAlt = (art: 'sb' | 'faehig' | 'block', wert: unknown): KiBefehl | undefined =>
    BEFEHLE.find(b => {
      const a = b.alt?.[art];
      return Array.isArray(a) ? a.includes(String(wert)) : a === wert;
    });
  /** Die fertige Anweisung, mit eingesetzter Sprache. */
  const auftrag = (id: unknown, werte: { sprache?: string } = {}): string => {
    const b = finde(id);
    if (!b) return '';
    return b.auftrag.replace('{sprache}', werte.sprache || b.vorgabe || 'Englisch');
  };

  return { alle, finde, ausAlt, auftrag };
})();
