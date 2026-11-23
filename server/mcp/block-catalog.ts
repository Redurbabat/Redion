/** Cloud-MCP catalogue generated from src/register/bloecke.ts.
 * Static snapshot of BUILT-IN block types only. Runtime extension types
 * registered on an individual device are not uploaded to Cloud-MCP.
 * CI compares this list against the UI registry to catch drift.
 * Entries marked insertable:false are internal persisted block types.
 */
export type CloudBlockType={id:string;name:string;gruppe:string;insertable:boolean};
export const BUILTIN_BLOCK_TYPES:readonly CloudBlockType[]=[
  {
    "id": "text",
    "name": "Text",
    "gruppe": "Grundlegend",
    "insertable": true
  },
  {
    "id": "h1",
    "name": "Überschrift 1",
    "gruppe": "Grundlegend",
    "insertable": true
  },
  {
    "id": "h2",
    "name": "Überschrift 2",
    "gruppe": "Grundlegend",
    "insertable": true
  },
  {
    "id": "h3",
    "name": "Überschrift 3",
    "gruppe": "Grundlegend",
    "insertable": true
  },
  {
    "id": "todo",
    "name": "Aufgabenliste",
    "gruppe": "Grundlegend",
    "insertable": true
  },
  {
    "id": "bullet",
    "name": "Aufzählungsliste",
    "gruppe": "Grundlegend",
    "insertable": true
  },
  {
    "id": "number",
    "name": "Nummerierte Liste",
    "gruppe": "Grundlegend",
    "insertable": true
  },
  {
    "id": "toggle",
    "name": "Toggle-Liste",
    "gruppe": "Grundlegend",
    "insertable": true
  },
  {
    "id": "toggle-h1",
    "name": "Toggle-Überschrift 1",
    "gruppe": "Grundlegend",
    "insertable": true
  },
  {
    "id": "toggle-h2",
    "name": "Toggle-Überschrift 2",
    "gruppe": "Grundlegend",
    "insertable": true
  },
  {
    "id": "toggle-h3",
    "name": "Toggle-Überschrift 3",
    "gruppe": "Grundlegend",
    "insertable": true
  },
  {
    "id": "quote",
    "name": "Zitat",
    "gruppe": "Grundlegend",
    "insertable": true
  },
  {
    "id": "callout",
    "name": "Callout",
    "gruppe": "Grundlegend",
    "insertable": true
  },
  {
    "id": "divider",
    "name": "Trennlinie",
    "gruppe": "Grundlegend",
    "insertable": true
  },
  {
    "id": "db-table",
    "name": "Tabelle",
    "gruppe": "Datenbank",
    "insertable": true
  },
  {
    "id": "db-board",
    "name": "Board",
    "gruppe": "Datenbank",
    "insertable": true
  },
  {
    "id": "db-list",
    "name": "Liste",
    "gruppe": "Datenbank",
    "insertable": true
  },
  {
    "id": "db-gallery",
    "name": "Galerie",
    "gruppe": "Datenbank",
    "insertable": true
  },
  {
    "id": "db-calendar",
    "name": "Kalender",
    "gruppe": "Datenbank",
    "insertable": true
  },
  {
    "id": "image",
    "name": "Bild",
    "gruppe": "Medien",
    "insertable": true
  },
  {
    "id": "video",
    "name": "Video",
    "gruppe": "Medien",
    "insertable": true
  },
  {
    "id": "audio",
    "name": "Audio",
    "gruppe": "Medien",
    "insertable": true
  },
  {
    "id": "file",
    "name": "Datei",
    "gruppe": "Medien",
    "insertable": true
  },
  {
    "id": "bookmark",
    "name": "Lesezeichen",
    "gruppe": "Medien",
    "insertable": true
  },
  {
    "id": "embed",
    "name": "Einbetten",
    "gruppe": "Medien",
    "insertable": true
  },
  {
    "id": "code",
    "name": "Code",
    "gruppe": "Erweitert",
    "insertable": true
  },
  {
    "id": "equation",
    "name": "Formel",
    "gruppe": "Erweitert",
    "insertable": true
  },
  {
    "id": "table",
    "name": "Einfache Tabelle",
    "gruppe": "Erweitert",
    "insertable": true
  },
  {
    "id": "spreadsheet",
    "name": "Kalkulationstabelle",
    "gruppe": "Datenbank",
    "insertable": true
  },
  {
    "id": "toc",
    "name": "Inhaltsverzeichnis",
    "gruppe": "Erweitert",
    "insertable": true
  },
  {
    "id": "breadcrumb",
    "name": "Pfad",
    "gruppe": "Erweitert",
    "insertable": true
  },
  {
    "id": "columns",
    "name": "Zwei Spalten",
    "gruppe": "Erweitert",
    "insertable": true
  },
  {
    "id": "columns3",
    "name": "Drei Spalten",
    "gruppe": "Erweitert",
    "insertable": true
  },
  {
    "id": "page",
    "name": "Unterseite",
    "gruppe": "Erweitert",
    "insertable": true
  },
  {
    "id": "pageref",
    "name": "Link zu Seite",
    "gruppe": "Erweitert",
    "insertable": true
  },
  {
    "id": "synced",
    "name": "Synchronisierter Block",
    "gruppe": "Erweitert",
    "insertable": true
  },
  {
    "id": "linkeddb",
    "name": "Verknüpfte Ansicht",
    "gruppe": "Datenbank",
    "insertable": true
  },
  {
    "id": "button",
    "name": "Knopf",
    "gruppe": "Erweitert",
    "insertable": true
  },
  {
    "id": "html",
    "name": "HTML",
    "gruppe": "Erweitert",
    "insertable": true
  },
  {
    "id": "flashcard",
    "name": "Karteikarte",
    "gruppe": "Wissen",
    "insertable": true
  },
  {
    "id": "blatt",
    "name": "A4-Blatt",
    "gruppe": "Wissen",
    "insertable": true
  },
  {
    "id": "whiteboard",
    "name": "Whiteboard",
    "gruppe": "Wissen",
    "insertable": true
  },
  {
    "id": "mindmap",
    "name": "Gedankenkarte",
    "gruppe": "Wissen",
    "insertable": true
  },
  {
    "id": "schaltplan",
    "name": "Schaltplan",
    "gruppe": "Wissen",
    "insertable": true
  },
  {
    "id": "chart",
    "name": "Diagramm",
    "gruppe": "Wissen",
    "insertable": true
  },
  {
    "id": "backlinks",
    "name": "Rückverweise",
    "gruppe": "Wissen",
    "insertable": true
  },
  {
    "id": "ai-write",
    "name": "KI: Text schreiben",
    "gruppe": "KI",
    "insertable": true
  },
  {
    "id": "ai-summary",
    "name": "KI: Zusammenfassen",
    "gruppe": "KI",
    "insertable": true
  },
  {
    "id": "ai-todo",
    "name": "KI: Aufgaben ableiten",
    "gruppe": "KI",
    "insertable": true
  },
  {
    "id": "ai-translate",
    "name": "KI: Übersetzen",
    "gruppe": "KI",
    "insertable": true
  },
  {
    "id": "ai-improve",
    "name": "KI: Text verbessern",
    "gruppe": "KI",
    "insertable": true
  },
  {
    "id": "pdfseite",
    "name": "PDF-Seite",
    "gruppe": "Intern",
    "insertable": false
  },
  {
    "id": "zeichenflaeche",
    "name": "Zeichenfläche",
    "gruppe": "Intern",
    "insertable": false
  },
  {
    "id": "spalte",
    "name": "Spalte",
    "gruppe": "Intern",
    "insertable": false
  },
  {
    "id": "database",
    "name": "Datenbank",
    "gruppe": "Intern",
    "insertable": false
  },
  {
    "id": "tabelle",
    "name": "Einfache Tabelle",
    "gruppe": "Intern",
    "insertable": false
  }
] as const;
