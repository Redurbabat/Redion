/** Gemeinsamer, endlicher Vertrag für Desktop-Bridge und MCP. Kein App-Datenspeicher. */
export type JsonSchema = { type?: string; properties?: Record<string, JsonSchema>; required?: string[];
  additionalProperties?: boolean | JsonSchema; items?: JsonSchema; enum?: unknown[]; maxLength?: number;
  minLength?: number; maxItems?: number; minItems?: number; minimum?: number; maximum?: number; pattern?: string };
export type ToolDefinition = { name: string; description: string; scope: string;
  permission: 'read' | 'write' | 'critical'; inputSchema: JsonSchema; outputSchema: JsonSchema };
export type ActionResult = { ok: boolean; data?: Record<string, unknown>; error?: { code: string; message: string }; operationId?: string };
const str = (maxLength = 12000): JsonSchema => ({ type: 'string', maxLength });
const id: JsonSchema = { ...str(80), minLength: 1, pattern: '^[A-Za-z0-9_-]+$' };
const num: JsonSchema = { type: 'number', minimum: -100000, maximum: 100000 };
const bool: JsonSchema = { type: 'boolean' };
const limit: JsonSchema = { type: 'integer', minimum: 1, maximum: 100 };
const obj = (properties: Record<string, JsonSchema>, required: string[] = []): JsonSchema =>
  ({ type: 'object', properties, required, additionalProperties: false });
const array = (items: JsonSchema, maxItems = 25): JsonSchema => ({ type: 'array', items, maxItems });
const enumeration = (...values: string[]): JsonSchema => ({ type: 'string', enum: values });
const block = obj({ type: enumeration('text','h1','h2','h3','bullet','number','todo','quote','callout','divider','code'), text: str(), checked: bool }, ['type','text']);
const output = obj({ ok: bool, data: { type: 'object', additionalProperties: true },
  error: obj({ code: str(80), message: str(500) }, ['code','message']), operationId: id }, ['ok']);
const defs: ToolDefinition[] = [];
const add = (suffix: string, scope: string, permission: ToolDefinition['permission'], description: string,
  properties: Record<string, JsonSchema> = {}, required: string[] = []): void => {
  defs.push({ name: 'redion_' + suffix, scope, permission, description,
    inputSchema: obj({ ...properties, ...(permission === 'critical' ? { confirmationId: id } : {}) }, required), outputSchema: output });
};
add('get_status','app','read','Zeigt den echten Verbindungsstatus. Überträgt keine Dokumente.');
add('get_capabilities','app','read','Liefert die tatsächlich implementierten Werkzeuge und deren Berechtigungen.');
add('focus_app','app','read','Holt das verbundene Redion-Fenster aus der Minimierung nach vorne.');
add('launch_app','app','read','Startet nur den zuvor in Redion freigegebenen und hashgeprüften installierten App-Pfad.',{allowLaunch:bool},['allowLaunch']);
add('get_current_view','app','read','Liest aktuelle Ansicht, Arbeitswelt und Editor, ohne Seiteninhalte.');
add('get_active_document','documents','read','Liest ID und Titel des geöffneten Dokuments, ohne dessen Inhalt.');
add('list_workspaces','app','read','Listet die vorhandenen Redion-Arbeitswelten.');
add('open_workspace','app','read','Öffnet eine vorhandene Arbeitswelt.',{workspaceId:enumeration('lernen','workspace')},['workspaceId']);
add('open_home','app','read','Öffnet die vorhandene Redion-Startansicht.');
add('list_documents','documents','read','Listet höchstens 100 freigegebene Seiten. Liest keine Seiteninhalte.',{limit});
add('search','documents','read','Sucht ausdrücklich nach einem Text in lesbaren Seiten; liefert begrenzte Treffer.',{query:{...str(200),minLength:1},limit},['query']);
add('open_document','documents','read','Öffnet eine lesbare Seite in der tatsächlichen App.',{documentId:id},['documentId']);
add('read_page','documents','read','Liest eine bestimmte Seite mit höchstens 100 direkten Textblöcken.',{documentId:id,limit},['documentId']);
add('create_page','documents','write','Erstellt eine echte Seite mit optionalen Textblöcken und öffnet sie.',{title:{...str(300),minLength:1},parentId:id,blocks:array(block),open:bool},['title']);
add('update_page','documents','write','Benennt eine Seite um; sichert vor der Änderung eine Fassung.',{documentId:id,title:{...str(300),minLength:1}},['documentId','title']);
add('insert_block','documents','write','Fügt einen validierten Text-, Überschrifts-, Listen- oder Checklistenblock ein.',{documentId:id,block,index:{type:'integer',minimum:0,maximum:10000}},['documentId','block']);
add('update_block','documents','write','Ersetzt den gesamten Text eines Textblocks als unformatierten Text, optional mit Haken. Für Korrekturen unter Erhalt bestehender Formatierung replace_text nutzen. expectedText verhindert veraltete Änderungen.',{blockId:id,text:str(),expectedText:str(),checked:bool},['blockId','text','expectedText']);
add('delete_block','documents','critical','Verschiebt einen einzelnen Textblock in den Papierkorb. Erfordert eine frische Bestätigung in Redion.',{blockId:id},['blockId']);
add('move_page','documents','write','Verschiebt eine Seite über den vorhandenen Speicherpfad; verhindert Kreise.',{documentId:id,parentId:id},['documentId','parentId']);
add('duplicate_page','documents','write','Dupliziert eine Seite über Redions vorhandene Duplizierfunktion.',{documentId:id},['documentId']);
add('replace_text','documents','write','Ersetzt genau eine eindeutige Textstelle. Bei mehreren Treffern bleibt der Bestand unverändert.',{documentId:id,find:{...str(),minLength:1},replacement:str()},['documentId','find','replacement']);
add('export_page','documents','critical','Gibt nach Bestätigung eine begrenzte Textausgabe einer einzelnen Seite an den MCP-Client zurück.',{documentId:id},['documentId']);
const fields: JsonSchema = { type: 'object', additionalProperties: true };
add('create_database','databases','write','Erstellt eine echte Datenbank mit dem bestehenden Standardschema.',{documentId:id,name:{...str(300),minLength:1}},['documentId','name']);
add('list_database_rows','databases','read','Liest Schema und höchstens 100 Zeilen einer lesbaren Datenbank.',{databaseId:id,limit},['databaseId']);
add('add_database_row','databases','write','Legt einen Datensatz mit validierten Werten für bestehende Spalten an.',{databaseId:id,properties:fields},['databaseId','properties']);
add('update_database_row','databases','write','Ändert bestehende Datenbankfelder nach Typ- und Rechteprüfung.',{rowId:id,properties:fields},['rowId','properties']);
add('create_flashcards','learning','write','Erstellt echte Lernkarten auf einer vorhandenen Seite; höchstens 25 pro Aktion.',{documentId:id,cards:{...array(obj({question:{...str(2000),minLength:1},answer:{...str(6000),minLength:1}},['question','answer']),25),minItems:1}},['documentId','cards']);
add('create_task','learning','write','Erstellt eine echte Aufgabe als Redion-Checklistenblock.',{documentId:id,text:{...str(2000),minLength:1}},['documentId','text']);
add('update_task','learning','write','Setzt den Erledigt-Status einer vorhandenen Aufgabe über Store.updateBlock.',{blockId:id,checked:bool},['blockId','checked']);
add('open_pdf','pdf','read','Öffnet die Seite eines bereits importierten PDF-Dokumentblocks. Kein beliebiger Dateipfad.',{blockId:id},['blockId']);
add('open_schematic','schematics','read','Öffnet die Seite eines vorhandenen Schaltplanblocks.',{blockId:id},['blockId']);
add('create_schematic','schematics','write','Fügt ein echtes neues Schaltplanblatt auf einer Seite ein.',{documentId:id,title:str(300)},['documentId']);
add('read_schematic','schematics','read','Liest Bauteile, Klemmenkennungen und Leitungen eines Schaltplans.',{blockId:id},['blockId']);
add('list_schematic_components','schematics','read','Listet die tatsächlich vorhandenen Bauteilarten und Anschlüsse.');
add('add_schematic_component','schematics','write','Fügt eine bekannte Bauteilart mit Raster- und Überlappungsprüfung ein.',{blockId:id,componentType:id,x:num,y:num,label:str(120)},['blockId','componentType','x','y']);
add('move_schematic_component','schematics','write','Verschiebt ein Bauteil mit vorhandener Leitungsnachführung und Überlappungsprüfung.',{blockId:id,componentId:id,x:num,y:num},['blockId','componentId','x','y']);
const terminal=obj({componentId:id,terminalId:str(80)},['componentId','terminalId']);
add('connect_schematic_components','schematics','write','Verbindet zwei tatsächliche Klemmen mit Redions Leitungsführung.',{blockId:id,from:terminal,to:terminal},['blockId','from','to']);
add('export_schematic','schematics','critical','Gibt nach Bestätigung SVG eines Schaltplans einschliesslich Annotationen zurück.',{blockId:id},['blockId']);
add('get_settings','settings','read','Liest ausschliesslich die freigegebenen Darstellungsoptionen; niemals Tokens oder Kontoeinstellungen.');
add('update_setting','settings','write','Ändert genau eine freigegebene Darstellungsoption.',{key:enumeration('theme','bewegung','kontrast','dichte'),value:{}},['key','value']);
add('undo','documents','write','Nimmt den letzten vorhandenen Verlaufsschritt der geöffneten Seite zurück.');
add('redo','documents','write','Wiederholt den vorhandenen Verlaufsschritt der geöffneten Seite.');
add('request_confirmation','app','read','Fragt den Menschen in Redion nach einer bestimmten kritischen Aktion. Führt sie noch nicht aus.',{tool:str(100),arguments:fields},['tool','arguments']);
add('get_operation_status','app','read','Liest den tatsächlichen Status einer Operation dieser Verbindungssitzung.',{operationId:id},['operationId']);
add('get_recent_errors','app','read','Liest Fehlercodes dieser Sitzung, ohne Dokumentinhalte oder Zugangsdaten.');
add('get_activity_log','app','read','Liest Werkzeugnamen, Zeiten und Ergebnisse dieser Sitzung, ohne Inhalte.');
export const TOOLS: readonly ToolDefinition[] = defs;
export const SCOPES = ['app','documents','databases','learning','pdf','schematics','settings'] as const;
export function actionErrorMessage(code:string):string {
  const messages:Record<string,string>={
    INVALID_DOCUMENT:'Diese lebende Dokument- oder Block-ID existiert nicht.',PERMISSION_DENIED:'Das aktuelle Redion-Konto darf diese Inhalte nicht bearbeiten oder lesen.',
    DOCUMENT_LOCKED:'Die Seite ist gesperrt.',EDITOR_BUSY:'Im Dokument wird gerade geschrieben. Eigene Eingabe zuerst abschliessen.',
    STALE_DOCUMENT:'Der gelesene Inhalt hat sich inzwischen geändert. Erneut lesen und die Änderung prüfen.',
    INVALID_DATABASE:'Die Datenbank existiert nicht.',INVALID_DATABASE_ROW:'Die Kennung bezeichnet keine Datenbankzeile.',
    INVALID_PROPERTY:'Die angegebene Spalte existiert nicht.',INVALID_PROPERTY_VALUE:'Ein Wert passt nicht zum vorhandenen Spaltentyp oder zu dessen Auswahl.',
    UNSUPPORTED_PROPERTY_TYPE:'Dieser Spaltentyp ist für MCP-Schreibzugriffe noch nicht freigegeben.',
    INVALID_SETTING:'Diese Einstellung oder dieser Wert ist nicht freigegeben.',UNSUPPORTED_BLOCK_TYPE:'Dieser Blocktyp ist für diese Textaktion nicht freigegeben.',
    AMBIGUOUS_TEXT:'Die Textstelle kommt mehrfach vor. Bitte eine eindeutige längere Stelle wählen.',TEXT_NOT_FOUND:'Die genaue Textstelle wurde nicht gefunden.',
    NO_HISTORY:'Es gibt keinen passenden Verlaufsschritt.',STALE_HISTORY:'Der Verlauf hat sich geändert. Aktion erneut prüfen.',
    ACTION_TOO_LARGE:'Die Aktion überschreitet die erlaubte Grösse.',ACTION_CANCELLED:'Die Verbindung wurde während der Vorbereitung widerrufen.',
    INVALID_SCHEMATIC:'Die Kennung bezeichnet keinen Schaltplan.',UNKNOWN_COMPONENT:'Diese Bauteilart oder Bauteil-ID existiert nicht.',
    INVALID_TERMINAL:'Diese Klemme existiert nicht oder ist im aktuellen Plan nicht anschliessbar.',WIRE_OVERLAP:'Die Leitung würde unzulässig überlappen.',
    COMPONENT_OVERLAP:'Das Bauteil überlappt ein vorhandenes Bauteil.',PLACEMENT_OUTSIDE_PAGE:'Das Bauteil liegt ausserhalb des Blatts.',
    SIMULATION_RUNNING:'Die Simulation muss vor elektrischen Änderungen angehalten werden.',INVALID_PDF:'Die Kennung bezeichnet keine importierte PDF-Seite.',
    PERSISTENCE_UNAVAILABLE:'Der lokale Speicher ist nicht zuverlässig verfügbar. Ergebnis in Redion prüfen.',
    MOVE_REJECTED:'Redion hat das Verschieben abgewiesen, etwa wegen einer Kreisreferenz.',INVALID_CARD_SEPARATOR:'Frage und Antwort dürfen den internen Trenner :: nicht enthalten.'};
  return messages[code]||'Die Aktion wurde von Redion abgewiesen.';
}
export function definition(name: unknown): ToolDefinition {
  const t = TOOLS.find(item => item.name === name);
  if (!t) throw fault('UNKNOWN_TOOL','Dieses Werkzeug wird nicht unterstützt.');
  return t;
}
export function fault(code: string, message: string): Error & { code: string } {
  return Object.assign(new Error(message), { code });
}
export function validate(schema: JsonSchema, input: unknown, depth = 0): void {
  if (depth > 16) throw fault('INVALID_INPUT','Die Eingabe ist zu tief verschachtelt.');
  if (typeof input === 'number' && !Number.isFinite(input)) throw fault('INVALID_INPUT','Ungültige Zahl.');
  if (schema.enum && !schema.enum.includes(input)) throw fault('INVALID_INPUT','Wert ausserhalb der erlaubten Auswahl.');
  const type = input === null ? 'null' : Array.isArray(input) ? 'array' : typeof input;
  if (schema.type && (schema.type === 'integer' ? !Number.isSafeInteger(input) : type !== schema.type))
    throw fault('INVALID_INPUT','Die Eingabe passt nicht zum Werkzeugvertrag.');
  if (typeof input === 'string' && ((schema.maxLength !== undefined && input.length > schema.maxLength) ||
      (schema.minLength !== undefined && input.length < schema.minLength) || (schema.pattern && !new RegExp(schema.pattern).test(input))))
    throw fault('INVALID_INPUT','Ungültige Zeichenfolge oder Kennung.');
  if (typeof input === 'number' && ((schema.minimum !== undefined && input < schema.minimum) || (schema.maximum !== undefined && input > schema.maximum)))
    throw fault('INVALID_INPUT','Zahl ausserhalb des erlaubten Bereichs.');
  if (Array.isArray(input)) {
    if ((schema.maxItems !== undefined && input.length > schema.maxItems) || (schema.minItems !== undefined && input.length < schema.minItems))
      throw fault('INVALID_INPUT','Unzulässige Anzahl von Einträgen.');
    input.forEach(value => validate(schema.items || {}, value, depth + 1));
  } else if (input && typeof input === 'object') {
    const record = input as Record<string, unknown>;
    for (const key of schema.required || []) if (!Object.hasOwn(record,key)) throw fault('INVALID_INPUT','Ein Pflichtfeld fehlt: '+key);
    for (const [key,value] of Object.entries(record)) {
      if (['__proto__','constructor','prototype'].includes(key)) throw fault('INVALID_INPUT','Unzulässiger Feldname.');
      const field = schema.properties?.[key];
      if (!field && schema.additionalProperties === false) throw fault('INVALID_INPUT','Unbekanntes Feld: '+key);
      validate(field || (typeof schema.additionalProperties === 'object' ? schema.additionalProperties : {}),value,depth+1);
    }
  }
}
export function validateCall(name: unknown, input: unknown): ToolDefinition {
  const tool = definition(name);
  if (JSON.stringify(input)?.length > 128 * 1024) throw fault('INVALID_INPUT','Die Aktion überschreitet 128 KiB.');
  validate(tool.inputSchema,input);
  return tool;
}
