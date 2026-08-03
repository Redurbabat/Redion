/* ============================================================================
 * register/eigenschaften.js — alle Spaltentypen an einer Stelle
 * ----------------------------------------------------------------------------
 * Hier entsteht ein neuer Spaltentyp. Danach steht er im Typmenü, in der
 * Filterauswahl, im Import und in der Schema-Ansicht — ohne dass jemand
 * vier Dateien nachträgt.
 *
 * Ein Eintrag ist bewusst knapp: id, Name, Zeichen. Alles Weitere — wie ein
 * Wert gelesen, gezeichnet, gefiltert und sortiert wird — steht im Bereich
 * Datenbanken. Ein Register beschreibt, es rechnet nicht.
 * ==========================================================================*/

window.Register = window.Register || {};

Register.eigenschaften = (() => {

  const EINGEBAUT = [
    { id:'title',      name:'Titel',            icon:'T'  },
    { id:'text',       name:'Text',             icon:'≡'  },
    { id:'number',     name:'Zahl',             icon:'#'  },
    { id:'select',     name:'Auswahl',          icon:'⊙'  },
    { id:'multi',      name:'Mehrfachauswahl',  icon:'⊞'  },
    { id:'status',     name:'Status',           icon:'◐'  },
    { id:'date',       name:'Datum',            icon:'📅' },
    { id:'person',     name:'Person',           icon:'👤' },
    { id:'checkbox',   name:'Kontrollkästchen', icon:'☑'  },
    /* Zwei Typen, die Notion nicht hat und die jeder mit Zahl plus
       Anzeige-Einstellung nachbaut — hier gleich richtig. */
    { id:'sterne',     name:'Bewertung',        icon:'★'  },
    { id:'prozent',    name:'Fortschritt',      icon:'▰'  },
    { id:'url',        name:'URL',              icon:'🔗' },
    { id:'email',      name:'E-Mail',           icon:'✉'  },
    { id:'phone',      name:'Telefon',          icon:'☎'  },
    { id:'formula',    name:'Formel',           icon:'∑'  },
    { id:'created',    name:'Erstellt am',      icon:'🕐' },
    { id:'edited',     name:'Zuletzt geändert', icon:'🕑' },
    { id:'files',      name:'Dateien',          icon:'📎' },
    { id:'relation',   name:'Verknüpfung',      icon:'⇄'  },
    { id:'rollup',     name:'Rollup',           icon:'⤴'  },
    { id:'uid',        name:'Laufende Nummer',  icon:'ID' },
    { id:'button',     name:'Knopf',            icon:'🔘' },
    { id:'ki',         name:'KI-Feld',          icon:'✨' },
    /* --- ab hier neu, damit alle 29 Typen aus Teil 7 da sind ------------- */
    { id:'createdBy',  name:'Erstellt von',     icon:'👤' },
    { id:'editedBy',   name:'Zuletzt bearbeitet von', icon:'👥' },
    { id:'place',      name:'Ort',              icon:'📍' },
    { id:'duration',   name:'Zeitspanne',       icon:'⏱'  },
    { id:'verify',     name:'Prüfung',          icon:'✔'  },
    { id:'ki-fassung', name:'KI: Zusammenfassung', icon:'✨' },
    { id:'ki-sprache', name:'KI: Übersetzung',  icon:'✨' },
    { id:'ki-worte',   name:'KI: Schlagwörter', icon:'✨' },
    /* --- Felder, die an einer Verbindung hängen (Notion: mit ↑-Abzeichen) -- */
    { id:'gdrive',     name:'Google Drive Datei', icon:'🟢', dienst:'google' },
    { id:'figma',      name:'Figma Datei',      icon:'🎨', dienst:'figma'  },
    { id:'githubpr',   name:'GitHub-Pull-Request', icon:'🐙', dienst:'github' },
    { id:'zendesk',    name:'Zendesk Ticket',   icon:'🎫', dienst:'zendesk' }
  ];

  /* Eine Liste, und immer dieselbe — siehe register/bloecke.js. */
  const LISTE = EINGEBAUT.slice();

  const melde = (eintrag) => {
    if (!eintrag || !eintrag.id) return false;
    if (LISTE.some(x => x.id === eintrag.id)) return false;
    LISTE.push(eintrag);
    return true;
  };

  const alle = () => LISTE;
  const eines = (id) => alle().find(x => x.id === id) || null;
  const name = (id) => (eines(id) || {}).name || id;
  const icon = (id) => (eines(id) || {}).icon || '≡';

  /* Gruppen, wie sie im Typmenü stehen. Eine Liste von 35 Einträgen ohne
     Gliederung findet niemand. */
  const GRUPPEN = {
    'Grundlegend': ['title','text','number','select','multi','status','date','person',
                    'files','checkbox','url','email','phone'],
    'Berechnet':   ['formula','rollup','relation','uid'],
    'Automatisch': ['created','edited','createdBy','editedBy'],
    'Weiteres':    []      /* alles, was in keiner Gruppe steht */
  };

  const inGruppe = (g) => {
    if (g !== 'Weiteres') return alle().filter(x => (GRUPPEN[g] || []).includes(x.id));
    const bekannt = new Set(Object.values(GRUPPEN).flat());
    return alle().filter(x => !bekannt.has(x.id));
  };

  return { alle, eines, name, icon, GRUPPEN, inGruppe, melde,
           anzahl: () => LISTE.length };
})();
