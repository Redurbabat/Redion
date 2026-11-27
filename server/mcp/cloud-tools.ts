/* Cloud-MCP actions on the existing Redion sync store.
 * No second document database. Every call checks token workspace selection,
 * current page role and encryption status. Writes are version-conditional.
 */
import type {Ablage} from '../typen.ts';
import type {McpPrincipal} from './oauth.ts';
import type {McpDatabase} from './state.ts';
import {rolleAuf,darf,notieren,feldRechte} from '../kern.ts';
import {BUILTIN_BLOCK_TYPES} from './block-catalog.ts';
import {BUILTIN_SYMBOLS} from './symbol-catalog.ts';
import {editSchematic} from './schematic-edit.ts';
import {measureOperatingPoint,runSwitchTest} from './schematic-test.ts';
import {buildLearningCard,buildLearningSet} from './learning-card.ts';
import {applyDatabaseValues,databaseBatchLimit,databaseFieldLimit,parseDatabaseChanges,readWritableDatabaseRowsSql,updateDatabaseRowsSql} from './database-edit.ts';
import {mindmap,board,sheet,papers,forms,shapes,alignments,mindmapLimit,editNode,editShape,editSelection,appendSheetMarks,moveSheetMark,readSheetMark,sheetMarkKinds} from './visual-blocks.ts';

type Db=McpDatabase;
type Args=Record<string,unknown>;
type ToolDef={name:string;description:string;inputSchema:{type:'object';properties:Record<string,unknown>;required?:string[];additionalProperties:boolean};annotations?:{title:string;readOnlyHint:boolean;destructiveHint:boolean;idempotentHint:boolean;openWorldHint:boolean}};
export class CloudMcpToolError extends Error {
  readonly reason:string;
  constructor(reason:string, message:string){super(message);this.reason=reason;}
}
const err=(reason:string,message:string):never=>{throw new CloudMcpToolError(reason,message);};
const text=(value:unknown,max:number):string=>typeof value==='string'&&value.length<=max?value:'';
const required=(value:unknown,max:number):string=>{
  const s=text(value,max).trim();if(!s)return err('invalid_arguments','Ein erforderlicher Text fehlt oder ist zu lang.');return s;
};
// Only these fixed parameter positions are used by the two UPDATE statements.
const unchangedEmbedding=(parameter:'?7'|'?8')=>
  'AND NOT EXISTS (SELECT 1 FROM json_each('+parameter+') ancestor WHERE NOT EXISTS ('+
  'SELECT 1 FROM saetze p WHERE p.bereich=?3 AND p.seite=?5 AND p.tabelle=\'blocks\' '+
  "AND p.id=json_extract(ancestor.value,'$.id') AND p.version=json_extract(ancestor.value,'$.version') "+
  'AND p.geloescht=0 AND p.verschluesselt=0)) ';
const limit=(value:unknown,fallback:number,max:number):number=>value===undefined?fallback:
  Number.isSafeInteger(value)&&Number(value)>0&&Number(value)<=max?Number(value):
  err('invalid_arguments','Ungültige Anzahl.');
const archiveFlag=(value:unknown):number=>value===undefined||value===false?0:value===true?1:
  err('invalid_arguments','archived muss true oder false sein.');
const nameField={type:'string',maxLength:160};
const idField={type:'string',maxLength:128};
const workspace={workspaceId:idField};
const documentId={documentId:idField};
const SCHEMATIC_ARTEN=[
  'stromlauf-aufgeloest','stromlauf-zusammenhaengend','hauptstromkreis',
  'installationsplan','uebersichtsplan','klemmenplan','verdrahtungsplan',
  'anschlussplan','blockschaltbild','funktionsplan','aufbauplan'
];
const SCHEMATIC_QUER=new Set(['installationsplan','blockschaltbild','funktionsplan','aufbauplan']);
const vId={type:'string',maxLength:64};
const vColor={type:'string',pattern:'^#[0-9a-fA-F]{6}$'};
const vNodes={type:'array',minItems:1,maxItems:mindmapLimit,items:{type:'object',properties:{id:vId,text:{type:'string',maxLength:500},parentId:{type:['string','null'],maxLength:64},side:{type:'string',enum:['links','rechts']},color:vColor,form:{type:'string',enum:forms},collapsed:{type:'boolean'}},required:['id','text','parentId'],additionalProperties:false}};
const vLayout={type:'string',enum:['karte','links','rechts']};
const vCamera={type:'object',properties:{x:{type:'number',minimum:-100000,maximum:100000},y:{type:'number',minimum:-100000,maximum:100000},z:{type:'number',minimum:.02,maximum:4}},required:['x','y','z'],additionalProperties:false};
const vLinks={type:'array',maxItems:mindmapLimit,items:{type:'object',properties:{id:vId,from:vId,to:vId},required:['id','from','to'],additionalProperties:false}};
const vCoord={type:'number',minimum:-10000,maximum:10000};
const vStrokeWidth={type:'number',minimum:0.1,maximum:50};
const vRotation={type:'number',minimum:-360,maximum:360};
const vShapes={type:'array',maxItems:100,items:{type:'object',properties:{id:vId,kind:{type:'string',enum:shapes},x:vCoord,y:vCoord,width:vCoord,height:vCoord,color:vColor,text:{type:'string',maxLength:1000},filled:{type:'boolean'},from:vId,to:vId,points:{type:'array',minItems:2,maxItems:500,items:{type:'array',minItems:2,maxItems:2,items:vCoord}},pressure:{type:'array',minItems:2,maxItems:500,items:{type:'number',minimum:0.05,maximum:1}},strokeWidth:vStrokeWidth,marker:{type:'boolean'},rotation:vRotation},required:['id','kind'],additionalProperties:false}};
const vSheetCoord={type:'number',minimum:0,maximum:10000};
const vSheetMarks={type:'array',minItems:1,maxItems:40,items:{type:'object',properties:{
  id:vId,kind:{type:'string',enum:sheetMarkKinds},color:vColor,points:{type:'array',minItems:2,maxItems:500,
    items:{type:'array',minItems:2,maxItems:2,items:vSheetCoord}},strokeWidth:{type:'number',minimum:0.5,maximum:48},
  x:vSheetCoord,y:vSheetCoord,width:{type:'number',minimum:24,maximum:10000},
  fontSize:{type:'number',minimum:8,maximum:96},bold:{type:'boolean'},text:{type:'string',maxLength:1000}
},required:['id','kind'],additionalProperties:false}};
const vCreate={...workspace,...documentId,expectedVersion:{type:'integer',minimum:1},requestId:{type:'string',minLength:8,maxLength:100},title:nameField};
const vRequired=['workspaceId','documentId','expectedVersion','requestId','title'];
const shapeSelectionOperations=['group_selection','ungroup_selection','align_selection','move_selection','order_selection'];
const mindmapEditOperations=['rename_node','style_node','delete_branch','append_node','move_node','add_connection','remove_connection'];
const schematicEditFields={
  operation:{type:'string',enum:['add_component','connect_terminals','add_label','move_component','move_label']},
  componentId:idField,symbolId:idField,x:{type:'integer',minimum:0,maximum:4000},
  y:{type:'integer',minimum:0,maximum:4000},
  rotation:{type:'integer',enum:[0,90,180,270]},
  mirrored:{type:'boolean'},layer:{type:'string',enum:['plan','aufgabe','loesung']},
  bmk:{type:'string',maxLength:30},wireId:idField,
  fromComponentId:idField,fromTerminal:{type:'string',minLength:1,maxLength:20},
  toComponentId:idField,toTerminal:{type:'string',minLength:1,maxLength:20},
  labelId:idField,labelText:{type:'string',minLength:1,maxLength:200}
};
export const CLOUD_TOOLS:ToolDef[]=[
  {name:'redion_create_mindmap',description:'Erstellt eine native editierbare Mindmap mit Knoten, Farben und Querverbindungen. parentId null für die Wurzel.',
    inputSchema:{type:'object',properties:{...vCreate,nodes:vNodes,connections:vLinks,layout:vLayout,camera:vCamera},required:[...vRequired,'nodes'],additionalProperties:false}},
  {name:'redion_create_whiteboard',description:'Erstellt ein natives Whiteboard mit Formen, Texten, Haftnotizen, Pfeilen, Verbindungen und Stiftstrichen (points als [x,y]-Paare).',
    inputSchema:{type:'object',properties:{...vCreate,shapes:vShapes},required:[...vRequired,'shapes'],additionalProperties:false}},
  {name:'redion_create_sheet',description:'Erstellt ein natives A4-Blatt im Hoch- oder Querformat mit Papier, Seitenzahl und optionalen Text- oder Zeichenmarken. Positionen in Blattpunkten ab der linken oberen Ecke.',
    inputSchema:{type:'object',properties:{...vCreate,paper:{type:'string',enum:papers},pages:{type:'integer',minimum:1,maximum:10},orientation:{type:'string',enum:['portrait','landscape']},marks:vSheetMarks},required:vRequired,additionalProperties:false}},
  {name:'redion_read_visual',description:'Liest Mindmaps, Whiteboards, A4-Blätter und PDF-Seiten mit Version. collection, offset und limit paginieren Knoten, Verbindungen, Formen, Zeichenmarken oder gespeicherten PDF-Text. Für nextOffset dieselbe collection und expectedVersion verwenden.',
    inputSchema:{type:'object',properties:{...workspace,blockId:idField,
      collection:{type:'string',enum:['nodes','connections','shapes','marks','pdf_text']},
      offset:{type:'integer',minimum:0,maximum:100000},limit:{type:'integer',minimum:1,maximum:40},
      expectedVersion:{type:'integer',minimum:1}
    },required:['workspaceId','blockId'],additionalProperties:false}},
  {name:'redion_update_visual',description:'Bearbeitet native Zeichenobjekte mit Versionsprüfung. Mindmap-Knoten und Querverbindungen, Whiteboard-Formen und Gruppen, A4-Papier und Zeichenmarken auf A4-Blättern oder PDF-Seiten.',
    inputSchema:{type:'object',properties:{...workspace,blockId:idField,expectedVersion:{type:'integer',minimum:1},operation:{type:'string',enum:['replace_mindmap',...mindmapEditOperations,'append_shapes','move_shape','resize_shape','style_shape','delete_shape','rotate_shape','order_shape','lock_shape','move_stroke','set_paper','append_marks','move_mark',...shapeSelectionOperations]},nodes:vNodes,connections:vLinks,layout:vLayout,camera:vCamera,node:vNodes.items,parentId:vId,connection:vLinks.items,shapes:vShapes,marks:vSheetMarks,paper:{type:'string',enum:papers},elementId:vId,text:{type:'string',maxLength:1000},color:vColor,form:{type:'string',enum:forms},collapsed:{type:'boolean'},filled:{type:'boolean'},x:vCoord,y:vCoord,width:vCoord,height:vCoord,rotation:vRotation,strokeWidth:vStrokeWidth,marker:{type:'boolean'},locked:{type:'boolean'},order:{type:'string',enum:['front','back','forward','backward']},dx:vCoord,dy:vCoord,
      selection:{type:'array',minItems:1,maxItems:40,uniqueItems:true,items:vId},groupId:vId,alignment:{type:'string',enum:alignments}},required:['workspaceId','blockId','expectedVersion','operation'],additionalProperties:false}},

  {name:'redion_list_workspaces',description:'Zeigt nur die für diese KI-Verbindung freigegebenen Bereiche.',
    inputSchema:{type:'object',properties:{},additionalProperties:false}},
  {name:'redion_search',description:'Sucht nach freigegebenen, nicht verschlüsselten Seiten. archived: true durchsucht das Archiv.',
    inputSchema:{type:'object',properties:{...workspace,query:{type:'string',maxLength:200},archived:{type:'boolean'},limit:{type:'integer',minimum:1,maximum:30},offset:{type:'integer',minimum:0,maximum:1000}},required:['workspaceId'],additionalProperties:false}},
  {name:'redion_read_page',description:'Liest Markdown und (bei blockbasierten Seiten) eine rechtegefilterte Blockvorschau. blockOffset und blockLimit paginieren sichtbare direkte Kinder unabhängig von Markdown. Bei älteren Clients steht bereits die erste Vorschau ohne Zusatzparameter bereit.',
    inputSchema:{type:'object',properties:{...workspace,...documentId,offset:{type:'integer',minimum:0},limit:{type:'integer',minimum:1,maximum:12000},blockOffset:{type:'integer',minimum:0,maximum:100000},blockLimit:{type:'integer',minimum:1,maximum:20},expectedVersion:{type:'integer',minimum:1},responseFormat:{type:'string',enum:['portable','legacy']}},required:['workspaceId','documentId'],additionalProperties:false}},
  {name:'redion_get_page_path',description:'Zeigt den Pfad einer lesbaren Seite von der Hauptseite bis zum Dokument. Wenn ein Vorfahr nicht lesbar ist, werden keine Pfadteile offengelegt.',
    inputSchema:{type:'object',properties:{...workspace,...documentId},required:['workspaceId','documentId'],additionalProperties:false}},
  {name:'redion_read_pages',description:'Liest bis zu 10 Seiten auf einmal, maximal 2.000 Zeichen pro Seite. Unzugängliche IDs werden einheitlich als nicht verfügbar markiert.',
    inputSchema:{type:'object',properties:{...workspace,documentIds:{type:'array',items:{type:'string',minLength:1,maxLength:128},minItems:1,maxItems:10},maxChars:{type:'integer',minimum:1,maximum:2000}},
      required:['workspaceId','documentIds'],additionalProperties:false}},
  {name:'redion_update_block',description:'Ändert Text oder geprüfte Aufgabenfelder eines lesbaren, eingebetteten Klartextblocks. Schreibscope, Seitenrechte, vollständige Elternkette und Blockversion werden geprüft.',
    inputSchema:{type:'object',properties:{...workspace,blockId:idField,
      expectedVersion:{type:'integer',minimum:1},
      operation:{type:'string',enum:['set_text','set_checked','set_note','set_due_date']},
      text:{type:'string',maxLength:8000},checked:{type:'boolean'},
      note:{type:'string',maxLength:2000},dueDate:{type:'string',maxLength:10}},
      required:['workspaceId','blockId','expectedVersion','operation'],additionalProperties:false}},
  {name:'redion_update_schematic',description:'Bearbeitet einen Klartext-Schaltplan. Für eine einzelne Änderung operation und ihre Felder übergeben. Für bis zu 20 atomare Änderungen nur changes übergeben. Jeder Schritt wird vor dem Speichern geprüft, die Planversion steigt einmal. Verbundene Bauteile im nativen Editor verschieben.',
    inputSchema:{type:'object',properties:{...workspace,blockId:idField,
      expectedVersion:{type:'integer',minimum:1},
      ...schematicEditFields,changes:{type:'array',minItems:1,maxItems:20,
        items:{type:'object',properties:schematicEditFields,required:['operation'],additionalProperties:false}}},
      required:['workspaceId','blockId','expectedVersion'],additionalProperties:false}},
  {name:'redion_add_schematic',description:'Erstellt einen leeren Schaltplan mit dem nativen RED-ION-Format auf einer freigegebenen Seite. Kein automatisch gezeichneter Stromkreis und keine Sicherheitsabnahme. Atomar, versioniert, mit requestId wiederholbar.',
    inputSchema:{type:'object',properties:{...workspace,...documentId,
      expectedVersion:{type:'integer',minimum:1},
      art:{type:'string',enum:SCHEMATIC_ARTEN},
      titel:{type:'string',maxLength:120},
      requestId:{type:'string',minLength:8,maxLength:100}},
      required:['workspaceId','documentId','expectedVersion','art'],additionalProperties:false}},
  {name:'redion_create_learning_card',description:'Erstellt eine echte Lernkarte im RED ION Trainer: klassische Karten, Single/Multiple Choice, Richtig/Falsch (Optionen Richtig, Falsch), Lücken (___) und kleine Rasterbilder. Eine Karte je Aufruf, parentVersion für nächste Karte. KI prüft fachliche Antworten selbst.',
    inputSchema:{type:'object',properties:{...workspace,...documentId,
      expectedVersion:{type:'integer',minimum:1},requestId:{type:'string',minLength:8,maxLength:100},
      kind:{type:'string',enum:['flashcard','single_select','multi_select','true_false','cloze']},
      deck:{type:'string',minLength:1,maxLength:160},topic:{type:'string',maxLength:160},subject:{type:'string',maxLength:120},
      question:{type:'string',minLength:1,maxLength:2000},answer:{type:'string',minLength:1,maxLength:2000},
      explanation:{type:'string',maxLength:1500},source:{type:'string',maxLength:300},
      options:{type:'array',minItems:2,maxItems:4,items:{type:'object',properties:{text:{type:'string',minLength:1,maxLength:500},correct:{type:'boolean'}},required:['text','correct'],additionalProperties:false}},
      image:{type:'object',properties:{data:{type:'string',maxLength:12000},alt:{type:'string',minLength:1,maxLength:300}},required:['data','alt'],additionalProperties:false}},
      required:['workspaceId','documentId','expectedVersion','kind','deck','question','answer'],additionalProperties:false}},
  {name:'redion_create_learning_set',description:'Erstellt 1–20 Lernkarten eines Sets in einer atomaren Transaktion. Ein gemeinsames deck, optional topic/subject, gemischte Quizarten und kleine Rasterbilder. requestId ist Pflicht; parentVersion für weitere Sets.',
    inputSchema:{type:'object',properties:{...workspace,...documentId,expectedVersion:{type:'integer',minimum:1},requestId:{type:'string',minLength:8,maxLength:100},
      deck:{type:'string',minLength:1,maxLength:160},topic:{type:'string',maxLength:160},subject:{type:'string',maxLength:120},
      cards:{type:'array',minItems:1,maxItems:20,items:{type:'object',properties:{kind:{type:'string',enum:['flashcard','single_select','multi_select','true_false','cloze']},
      topic:{type:'string',maxLength:160},subject:{type:'string',maxLength:120},
      question:{type:'string',minLength:1,maxLength:2000},answer:{type:'string',minLength:1,maxLength:2000},
      explanation:{type:'string',maxLength:1500},source:{type:'string',maxLength:300},
      options:{type:'array',minItems:2,maxItems:4,items:{type:'object',properties:{text:{type:'string',minLength:1,maxLength:500},correct:{type:'boolean'}},required:['text','correct'],additionalProperties:false}},
      image:{type:'object',properties:{data:{type:'string',maxLength:12000},alt:{type:'string',minLength:1,maxLength:300}},required:['data','alt'],additionalProperties:false}},required:['kind','question','answer'],additionalProperties:false}}},
      required:['workspaceId','documentId','expectedVersion','requestId','deck','cards'],additionalProperties:false}},
  {name:'redion_add_block',description:'Erstellt einen sicheren Text- oder Todo-Block auf einer freigegebenen Seite; neue Blockzeile und Elternliste werden in einer D1-Transaktion gespeichert. requestId optional, Wiederholung mit derselben Seitenversion idempotent. Verschachtelte Blöcke noch nicht unterstützt.',
    inputSchema:{type:'object',properties:{...workspace,...documentId,expectedVersion:{type:'integer',minimum:1},
      typ:{type:'string',enum:['text','h1','h2','h3','todo','bullet','number','quote','code','divider']},text:{type:'string',maxLength:12000},
      daten:{type:'object',additionalProperties:true},inBlockId:idField,
      requestId:{type:'string',minLength:8,maxLength:100}},
      required:['workspaceId','documentId','expectedVersion','typ'],additionalProperties:false}},
  {name:'redion_create_page',description:'Legt eine Seite an. requestId verhindert doppelte Erstellung bei Wiederholung.',
    inputSchema:{type:'object',properties:{...workspace,title:nameField,content:{type:'string',maxLength:12000},parentId:idField,requestId:{type:'string',minLength:8,maxLength:100}},
      required:['workspaceId','title','requestId'],additionalProperties:false}},
  {name:'redion_update_page',description:'Ändert den Seitentitel oder den Archivstatus nur bei passender expectedVersion. archived: false holt die Seite aus dem Archiv.',
    inputSchema:{type:'object',properties:{...workspace,...documentId,title:nameField,archived:{type:'boolean'},expectedVersion:{type:'integer',minimum:1}},
      required:['workspaceId','documentId','expectedVersion'],additionalProperties:false}},
  {name:'redion_list_page_blocks',description:'Liest sichtbare Seitenblöcke und verschachtelte Kindblöcke in stabiler Reihenfolge und kleinen Seiten. Offset zählt nur tatsächlich lesbare Blöcke; expectedVersion verhindert das Vermischen veränderter Listen.',
    inputSchema:{type:'object',properties:{...workspace,...documentId,parentBlockId:idField,
      limit:{type:'integer',minimum:1,maximum:20},offset:{type:'integer',minimum:0,maximum:100000},
      expectedVersion:{type:'integer',minimum:1}},
      required:['workspaceId','documentId'],additionalProperties:false}},
  {name:'redion_read_block',description:'Liest einen Klartextblock mit begrenzter, paginierter sichtbarer Kinderliste. Bei grossen Blöcken erscheint childrenTruncated samt nextChildOffset, kein Fehler wegen mehr als 40 Kindern. Datenbankzeilen nicht direkt lesen.',
    inputSchema:{type:'object',properties:{...workspace,blockId:idField,
      childOffset:{type:'integer',minimum:0,maximum:100000},
      childLimit:{type:'integer',minimum:1,maximum:40}},required:['workspaceId','blockId'],additionalProperties:false}},
  {name:'redion_read_schematic',description:'Liest Bauteile, Leitungen, Beschriftungen und Planversion. Mit switchTest bis zu 32 Kombinationen gegen eine Sollfolge prüfen (letzter Schalter wechselt am schnellsten). Mit operatingPoint Strom, Spannung und Leistung für gewählte Schalterstellungen messen. Beide Modi benötigen expectedVersion und speichern keine Änderungen.',
    inputSchema:{type:'object',properties:{...workspace,blockId:idField,expectedVersion:{type:'integer',minimum:1},
      switchTest:{type:'object',additionalProperties:false,required:['switchIds','targetId','expected'],properties:{
        switchIds:{type:'array',minItems:1,maxItems:6,uniqueItems:true,items:idField},targetId:idField,
        expected:{type:'array',minItems:1,maxItems:32,items:{type:'boolean'}}
      }},operatingPoint:{type:'object',additionalProperties:false,required:['switches','componentIds'],properties:{
        switches:{type:'array',maxItems:12,items:{type:'object',additionalProperties:false,
          required:['componentId','position'],properties:{componentId:idField,position:{type:'integer',minimum:0,maximum:32}}}},
        componentIds:{type:'array',minItems:1,maxItems:8,uniqueItems:true,items:idField}
      }}},required:['workspaceId','blockId'],additionalProperties:false}},
  {name:'redion_list_symbols',description:'Listet die 131 eingebauten elektrotechnischen Fachzeichen mit Nummern und Positionen der Anschlüsse. Keine auf Geräten nachinstallierten Symbole; nicht als zertifizierte Normbibliothek verwenden.',
    inputSchema:{type:'object',properties:{gruppe:{type:'string',maxLength:40},suche:{type:'string',maxLength:80}},additionalProperties:false}},
  {name:'redion_list_block_types',description:'Listet eingebaute benannte Blockarten der RED-ION-App, inklusive intern gespeicherter Arten. Gerätebezogene Plugins sind nicht enthalten.',
    inputSchema:{type:'object',properties:{},additionalProperties:false}},
  {name:'redion_list_tasks',description:'Listet lesbare Aufgaben aus Todo-Blöcken und aus Datenbankzeilen mit sichtbaren Status- oder Checkbox-Spalten. Nur sichtbare Treffer zählen bei der Paginierung.',
    inputSchema:{type:'object',properties:{...workspace,nurOffen:{type:'boolean'},
      limit:{type:'integer',minimum:1,maximum:40},offset:{type:'integer',minimum:0,maximum:1000}},required:['workspaceId'],additionalProperties:false}},
  {name:'redion_read_database',description:'Liest freigegebene Datenbankspalten und sichtbare Zeilen. Kompatibilität mit älteren Clients: limit bis 500 wird akzeptiert, aber pro Antwort sicher auf maximal 10 sichtbare Zeilen begrenzt. effectiveLimit und limitCapped zeigen das an; für weitere Zeilen nextOffset verwenden.',
    inputSchema:{type:'object',properties:{...workspace,databaseId:idField,limit:{type:'integer',minimum:1,maximum:500},
      offset:{type:'integer',minimum:0,maximum:1000}},required:['workspaceId','databaseId'],additionalProperties:false}},
  {name:'redion_update_database_rows',description:'Ändert bis zu zehn native Datenbankzeilen atomar. Unterstützt Titel, Text, Zahl, Checkbox und Datum. Erfordert Datenbankblock-ID, Schema-Version und Version je Zeile.',
    inputSchema:{type:'object',properties:{...workspace,databaseId:idField,databaseBlockId:idField,
      expectedDatabaseVersion:{type:'integer',minimum:1},
      changes:{type:'array',minItems:1,maxItems:databaseBatchLimit,items:{type:'object',properties:{
        rowId:idField,expectedVersion:{type:'integer',minimum:1},
        values:{type:'object',minProperties:1,maxProperties:databaseFieldLimit,
          additionalProperties:{type:['string','number','boolean'],maxLength:4000}}
      },required:['rowId','expectedVersion','values'],additionalProperties:false}}
    },required:['workspaceId','databaseId','databaseBlockId','expectedDatabaseVersion','changes'],additionalProperties:false}},
  {name:'redion_list_databases',description:'Listet lesbare Klartext-Datenbanken auf Seiten, die der Benutzer lesen darf. Keine versteckten Seiten oder Spaltenwerte.',
    inputSchema:{type:'object',properties:{...workspace,limit:{type:'integer',minimum:1,maximum:30},offset:{type:'integer',minimum:0,maximum:1000}},required:['workspaceId'],additionalProperties:false}},
  {name:'redion_list_root_pages',description:'Listet freigegebene Hauptseiten eines Arbeitsbereichs; nur sichtbare Seiten zählen bei limit und offset.',
    inputSchema:{type:'object',properties:{...workspace,archived:{type:'boolean'},limit:{type:'integer',minimum:1,maximum:100},offset:{type:'integer',minimum:0,maximum:100000}},required:['workspaceId'],additionalProperties:false}},
  {name:'redion_list_child_pages',description:'Listet lesbare, unverschlüsselte Unterseiten einer Seite auf.',
    inputSchema:{type:'object',properties:{...workspace,parentId:idField,archived:{type:'boolean'},limit:{type:'integer',minimum:1,maximum:100},offset:{type:'integer',minimum:0,maximum:100000}},required:['workspaceId','parentId'],additionalProperties:false}},
  {name:'redion_append_content',description:'Hängt Markdown an eine Klartext-Seite an; benötigt Schreibrecht und passende Version.',
    inputSchema:{type:'object',properties:{...workspace,...documentId,content:{type:'string',minLength:1,maxLength:4000},expectedVersion:{type:'integer',minimum:1}},required:['workspaceId','documentId','content','expectedVersion'],additionalProperties:false}},
  {name:'redion_move_page',description:'Verschiebt eine Klartext-Seite unter eine andere Seite oder auf die oberste Ebene. Prüft Schreibrechte, Zyklen und Version.',
    inputSchema:{type:'object',properties:{...workspace,...documentId,newParentId:idField,expectedVersion:{type:'integer',minimum:1}},required:['workspaceId','documentId','expectedVersion'],additionalProperties:false}},
  {name:'redion_replace_text',description:'Ersetzt Text im Seiteninhalt mit Versionskontrolle; nicht in verschlüsselten Seiten.',
    inputSchema:{type:'object',properties:{...workspace,...documentId,find:{type:'string',minLength:1,maxLength:2000},
      replacement:{type:'string',maxLength:4000},expectedVersion:{type:'integer',minimum:1}},
      required:['workspaceId','documentId','find','replacement','expectedVersion'],additionalProperties:false}}
];
const writeNames=new Set(['redion_create_page','redion_update_page','redion_replace_text','redion_append_content','redion_move_page','redion_add_block','redion_add_schematic','redion_update_schematic','redion_update_block','redion_create_learning_card','redion_create_learning_set','redion_create_mindmap','redion_create_whiteboard','redion_create_sheet','redion_update_visual','redion_update_database_rows']);
// MCP annotations tell AI clients which tools are read-only, additive or
// modifying. They are advisory; server-side OAuth and ACL checks still govern.
const toolTitles:Record<string,string>={
  redion_list_workspaces:'Bereiche auflisten',
  redion_search:'Seiten und Inhalte suchen',
  redion_read_page:'Seite lesen',
  redion_get_page_path:'Seitenpfad anzeigen',
  redion_read_pages:'Mehrere Seiten lesen',
  redion_create_page:'Seite erstellen',
  redion_add_block:'Block oder Aufgabe erstellen',
  redion_create_learning_card:'Lernkarte oder Quizfrage erstellen',
  redion_create_learning_set:'Lernkartenset erstellen',
  redion_add_schematic:'Leeren Schaltplan erstellen',
  redion_update_schematic:'Schaltplan ergänzen',
  redion_update_block:'Blocktext oder Aufgabe bearbeiten',
  redion_update_page:'Seitentitel ändern',
  redion_list_databases:'Datenbanken auflisten',
  redion_read_database:'Datenbank lesen',
  redion_update_database_rows:'Datenbankzeilen bearbeiten',
  redion_list_tasks:'Aufgaben auflisten',
  redion_list_block_types:'Blockarten auflisten',
  redion_list_symbols:'Schaltzeichen auflisten',
  redion_list_page_blocks:'Seitenblöcke auflisten',
  redion_read_block:'Block lesen',
  redion_read_schematic:'Schaltplan lesen',
  redion_list_root_pages:'Hauptseiten auflisten',
  redion_list_child_pages:'Unterseiten auflisten',
  redion_append_content:'Inhalt anhängen',
  redion_move_page:'Seite verschieben',
  redion_replace_text:'Text ersetzen'
};
const destructiveNames=new Set(['redion_update_page','redion_move_page','redion_replace_text','redion_update_block','redion_update_visual','redion_update_database_rows']);
export const visibleCloudTools=(p:McpPrincipal):ToolDef[]=>
  CLOUD_TOOLS.filter(t=>!writeNames.has(t.name)||p.scopes.includes('redion:write'))
    .map(t=>{
      const readOnly=!writeNames.has(t.name);
      return {...t,annotations:{
        title:toolTitles[t.name]||t.name,readOnlyHint:readOnly,
        destructiveHint:destructiveNames.has(t.name),
        idempotentHint:t.name==='redion_create_page'||t.name==='redion_add_block'||t.name==='redion_add_schematic'||t.name==='redion_create_learning_card'||t.name==='redion_create_learning_set'||['redion_create_mindmap','redion_create_whiteboard','redion_create_sheet'].includes(t.name),
        openWorldHint:false
      }};
    });

export const createCloudActions=(ablage:Ablage,db:Db,principal:McpPrincipal)=>{
  const userId=principal.userId;
  const inScope=async(workspaceId:unknown)=>{
    const id=required(workspaceId,128);
    if(!principal.workspaceIds.includes(id))return err('forbidden','Dieser Arbeitsbereich wurde nicht freigegeben.');
    const b=await ablage.hole('bereiche',{id});
    if(!b)return err('not_found','Arbeitsbereich nicht gefunden.');
    return b;
  };
  const role=async(w:string,page:string,permission:'lesen'|'bearbeiten')=>{
    const r=await rolleAuf(ablage,w,page,userId);
    if(!darf(r,permission))err('forbidden','Keine Berechtigung für diese Aktion.');
  };
  const page=async(w:string,id:string,permission:'lesen'|'bearbeiten')=>{
    const s=await ablage.hole('saetze',{bereich:w,id});
    if(!s||s.geloescht||s.tabelle!=='blocks')return err('not_found','Seite nicht gefunden.');
    await role(w,String(s.seite||id),permission);
    if(s.verschluesselt)return err('encrypted','Verschlüsselte Inhalte sind für die Cloud nicht lesbar.');
    let data:Record<string,unknown>;
    try{data=JSON.parse(String(s.daten||'{}'));}catch{return err('invalid_data','Unlesbares Seitenformat.');}
    if(!data||data.type!=='page')return err('not_found','Kein Seiteneintrag.');
    return {s,data};
  };
  const expected=(v:unknown):number=>{
    if(!Number.isSafeInteger(v)||Number(v)<1)return err('invalid_arguments','expectedVersion muss eine positive ganze Zahl sein.');
    return Number(v);
  };
  /** A block's seite field alone never grants access to a detached record. */
  const embedding=async(w:string,pageId:string,id:string,data:Args)=>{
    let childId=id;
    let parentId=data.parentId;
    const seen=new Set([id]);
    const snapshots:{id:string;version:number}[]=[];
    for(let depth=0;depth<40;depth++){
      if(typeof parentId!=='string'||!parentId||parentId.length>128||seen.has(parentId))break;
      seen.add(parentId);
      const row=await ablage.hole('saetze',{bereich:w,id:parentId});
      if(!row||row.tabelle!=='blocks'||row.geloescht||row.verschluesselt||row.seite!==pageId)break;
      let parent:Args;
      try{parent=JSON.parse(String(row.daten));}catch{break;}
      if(!parent||parent.alive===false||parent.archiviert===true||parent.parentTable==='collection'||
          !Array.isArray(parent.content)||!parent.content.includes(childId))break;
      snapshots.push({id:parentId,version:Number(row.version)});
      if(parentId===pageId&&parent.type==='page')return snapshots;
      if(parent.type==='page')break;
      childId=parentId;
      parentId=parent.parentId;
    }
    return err('not_found','Block ist nicht auf einer lesbaren Seite eingebettet.');
  };
  const update=async(w:string,id:string,old:number,updated:Record<string,unknown>,guardParent?:string)=>{
    const payload=JSON.stringify(updated);
    if(payload.length>64000)return err('invalid_arguments','Seite ist für diese Änderung zu gross.');
    // The ancestry check runs in the same SQLite UPDATE as the write.
    // Concurrent moves cannot both validate an old tree and create a cycle.
    const guard=guardParent?
      " AND NOT EXISTS (WITH RECURSIVE ancestors(id,depth) AS ("+
      "SELECT ?6,0 UNION ALL "+
      "SELECT CASE WHEN json_valid(s.daten) THEN json_extract(s.daten,'$.parentId') ELSE NULL END,a.depth+1 "+
      "FROM ancestors a JOIN saetze s ON s.bereich=?3 AND s.id=a.id "+
      "WHERE a.id IS NOT NULL AND a.depth<40"+
      ") SELECT 1 FROM ancestors WHERE id=?4 OR depth>=40)":"";
    const sql="UPDATE saetze SET daten=?1,version=version+1,geaendert=?2,vonGeraet='Cloud-MCP' "+
      "WHERE bereich=?3 AND id=?4 AND version=?5 AND geloescht=0 AND verschluesselt=0 AND tabelle='blocks'"+
      guard+" RETURNING version";
    const values:(string|number)[]=[payload,new Date().toISOString(),w,id,old];
    if(guardParent)values.push(guardParent);
    const changed=await db.prepare(sql).bind(...values).first<{version:number}>();
    if(!changed)return err('conflict','Seite wurde zwischenzeitlich geändert oder der Zielordner wurde verschoben. Bitte erneut lesen.');
    await notieren(ablage,{bereich:w,kontoId:userId,art:'mcp',text:'Seite über Cloud-MCP bearbeitet',objekt:id});
    return {documentId:id,version:changed.version};
  };
  /** Fetch only embedded, visible children and paginate AFTER filtering.
   * No raw-reference count or hidden child IDs leave the server.
   * Used by read_page previews and read_block for old connector versions.
   */
  const visibleChildren=async(w:string,pageId:string,parentId:string,raw:unknown,
    offset:number,max:number)=>{
    if(raw!==undefined&&!Array.isArray(raw))
      return err('invalid_data','Blockliste ist kein Array.');
    const ids=Array.isArray(raw)?raw:[];
    if(ids.length>5000)return err('too_large','Blockliste überschreitet das sichere Leselimit.');
    if(ids.length===0)return {rows:[],nextOffset:null};
    const result=await db.prepare(
      "SELECT s.id,s.daten,s.version FROM json_each(?1) ref "+
      "JOIN saetze s ON s.bereich=?2 AND s.id=ref.value "+
      "WHERE ref.type='text' AND length(ref.value) BETWEEN 1 AND 128 "+
      "AND s.tabelle='blocks' AND s.geloescht=0 AND s.verschluesselt=0 "+
      "AND s.seite=?3 AND CASE WHEN json_valid(s.daten) THEN "+
      "(json_extract(s.daten,'$.parentId')=?4 AND "+
      "COALESCE(json_extract(s.daten,'$.parentTable'),'')<>'collection' AND "+
      "COALESCE(json_extract(s.daten,'$.alive'),1)<>0 AND "+
      "json_type(s.daten,'$.type')='text') ELSE 0 END "+
      "GROUP BY s.id ORDER BY MIN(CAST(ref.key AS INTEGER)) ASC LIMIT ?5 OFFSET ?6"
    ).bind(JSON.stringify(ids),w,pageId,parentId,max+1,offset)
      .all<{id:string;daten:string;version:number}>();
    return {rows:result.results.slice(0,max),
      nextOffset:result.results.length>max?offset+max:null};
  };
  return async(name:string,args:Args):Promise<unknown>=>{
    // Nicht vorhandene Werkzeugnamen sind keine verweigerte OAuth-Freigabe.
    // Ein App-Connector kann eine ältere Tool-Liste zwischenspeichern.
    if(!CLOUD_TOOLS.some(t=>t.name===name))
      return err('unknown_tool','Dieses Werkzeug ist im Cloud-MCP nicht implementiert. Bitte die aktuelle Werkzeugliste neu laden.');
    if(!visibleCloudTools(principal).some(t=>t.name===name))
      return err('forbidden','Für dieses Werkzeug fehlen die erforderlichen OAuth-Rechte.');
    if(name==='redion_list_symbols'){
      if(args.gruppe!==undefined&&(typeof args.gruppe!=='string'||args.gruppe.length>40))
        return err('invalid_arguments','Gruppe muss ein kurzer Text sein.');
      if(args.suche!==undefined&&(typeof args.suche!=='string'||args.suche.length>80))
        return err('invalid_arguments','Suchtext muss höchstens 80 Zeichen haben.');
      const gruppe=typeof args.gruppe==='string'?args.gruppe.trim():'';
      const suche=typeof args.suche==='string'?args.suche.trim().toLocaleLowerCase():'';
      const symbols=BUILTIN_SYMBOLS.filter(s=>(!gruppe||s.gruppe===gruppe)&&
        (!suche||[s.id,s.name,s.gruppe,s.kennbuchstabe].some(t=>t.toLocaleLowerCase().includes(suche))));
      return {symbols,total:symbols.length,builtinTotal:BUILTIN_SYMBOLS.length,
        raster:10,externalExtensionsIncluded:false};
    }
    if(name==='redion_list_block_types'){
      return {blockTypes:BUILTIN_BLOCK_TYPES,total:BUILTIN_BLOCK_TYPES.length,
        externalExtensionsIncluded:false};
    }
    if(name==='redion_list_workspaces'){
      const visible=[];
      for(const id of principal.workspaceIds.slice(0,20)){
        const b=await ablage.hole('bereiche',{id});
        if(!b)continue;
        const r=await rolleAuf(ablage,id,'*',userId);
        if(darf(r,'lesen'))visible.push({id,name:String(b.name||''),canWrite:darf(r,'bearbeiten')});
      }
      return {workspaces:visible};
    }
    const w=required(args.workspaceId,128);
    const area=await inScope(w);
    if(name==='redion_list_page_blocks'){
      const documentId=required(args.documentId,128);
      const ownPage=await page(w,documentId,'lesen');
      const parentId=args.parentBlockId===undefined?documentId:required(args.parentBlockId,128);
      let parent=ownPage;
      if(parentId!==documentId){
        const s=await ablage.hole('saetze',{bereich:w,id:parentId});
        if(!s||s.tabelle!=='blocks'||s.geloescht||s.verschluesselt||s.seite!==documentId)
          return err('not_found','Block nicht verfügbar.');
        let data:Record<string,unknown>;
        try{data=JSON.parse(String(s.daten||'')) as Record<string,unknown>;}
        catch{return err('not_found','Block nicht verfügbar.');}
        if(!data||typeof data!=='object'||Array.isArray(data)||data.alive===false||
          typeof data.type!=='string'||data.type==='page'||data.parentTable==='collection')
          return err('not_found','Block nicht verfügbar.');
        parent={s,data};
      }
      const parentVersion=Number(parent.s.version)||1;
      if(args.expectedVersion!==undefined&&expected(args.expectedVersion)!==parentVersion)
        return err('conflict','Blockliste wurde zwischenzeitlich geändert. Bitte erneut beginnen.');
      const raw=parent.data.content;
      if(raw!==undefined&&!Array.isArray(raw))
        return err('invalid_data','Blockliste ist kein Array.');
      const ids=Array.isArray(raw)?raw:[];
      if(ids.length>5000)return err('too_large','Blockliste überschreitet das sichere Leselimit.');
      const max=limit(args.limit,10,20);
      const offset=args.offset===undefined?0:args.offset;
      if(!Number.isSafeInteger(offset)||Number(offset)<0||Number(offset)>100000)
        return err('invalid_arguments','Ungültiger Blockversatz.');
      // A single D1 query preserves source order while filtering visibility
      // before LIMIT/OFFSET. Avoid per-child D1 reads (expensive on 200-block
      // pages and potentially over Cloudflare subrequest limits).
      const sql="SELECT s.id,s.daten,s.version FROM json_each(?1) AS ref "+
        "JOIN saetze AS s ON s.id=ref.value AND s.bereich=?2 "+
        "WHERE ref.type='text' AND length(ref.value) BETWEEN 1 AND 128 "+
        "AND s.tabelle='blocks' AND s.geloescht=0 AND s.verschluesselt=0 "+
        "AND s.seite=?3 AND CASE WHEN json_valid(s.daten) THEN "+
        "(json_type(s.daten,'$.type')='text' AND "+
        "json_extract(s.daten,'$.parentId')=?4 AND "+
        "COALESCE(json_extract(s.daten,'$.parentTable'),'')<>'collection' AND "+
        "COALESCE(json_extract(s.daten,'$.alive'),1)<>0) ELSE 0 END "+
        "GROUP BY s.id ORDER BY MIN(CAST(ref.key AS INTEGER)) ASC "+
        "LIMIT ?5 OFFSET ?6";
      const rows=await db.prepare(sql).bind(JSON.stringify(ids),w,documentId,
        parentId,max+1,Number(offset)).all<{id:string;daten:string;version:number}>();
      const blocks=rows.results.slice(0,max).map(s=>{
        const data=JSON.parse(s.daten) as Record<string,unknown>;
        const full=typeof data.text==='string'?data.text:'';
        return {blockId:s.id,type:String(data.type).slice(0,40),text:full.slice(0,2000),
          textTruncated:full.length>2000,version:Number(s.version)||1};
      });
      return {workspaceId:w,documentId,parentBlockId:parentId===documentId?null:parentId,
        parentVersion,blocks:blocks.slice(0,max),
        nextOffset:rows.results.length>max?Number(offset)+max:null};
    }
    if(name==='redion_read_block'||name==='redion_read_schematic'){
      const id=required(args.blockId,128);
      const s=await ablage.hole('saetze',{bereich:w,id});
      if(!s||s.tabelle!=='blocks'||s.geloescht||s.verschluesselt)
        return err('not_found','Block nicht verfügbar.');
      let data:Record<string,unknown>;
      try{data=JSON.parse(String(s.daten||'')) as Record<string,unknown>;}
      catch{return err('not_found','Block nicht verfügbar.');}
      if(!data||typeof data!=='object'||Array.isArray(data)||typeof data.type!=='string'||
         data.alive===false)
        return err('not_found','Block nicht verfügbar.');
      // A collection row is stored as a 'page' with s.seite=its own ID.
      // Never let it bypass database embedding/field permissions; those
      // rows must be accessed through redion_read_database.
      if(data.parentTable==='collection')
        return err('not_found','Datenbankzeilen bitte über redion_read_database lesen.');
      const pageId=String(s.seite||'');
      if(!pageId)return err('not_found','Block nicht verfügbar.');
      await page(w,pageId,'lesen');
      if(data.type==='schaltplan'){
        if(data.archiviert===true)return err('not_found','Schaltplan nicht verfügbar.');
        await embedding(w,pageId,id,data);
      }
      // Do not fail on a page with >40 children: return a bounded visible
      // window and a continuation cursor. Older clients can read page 1.
      const childOffset=args.childOffset===undefined?0:args.childOffset;
      if(!Number.isSafeInteger(childOffset)||Number(childOffset)<0||
        Number(childOffset)>100000)
        return err('invalid_arguments','Ungültiger Kindblockversatz.');
      const childLimit=limit(args.childLimit,40,40);
      const selection=await visibleChildren(w,pageId,id,data.content,
        Number(childOffset),childLimit);
      const visibleChildrenIds=selection.rows.map(child=>child.id);
      // No unfiltered nested IDs, including non-standard "children" arrays.
      const sanitized={...data,content:visibleChildrenIds};
      if('children' in sanitized)delete sanitized.children;
      if(name==='redion_read_schematic'){
        if(data.type!=='schaltplan'||!data.plan||typeof data.plan!=='object'||Array.isArray(data.plan))
          return err('not_found','Schaltplan nicht verfügbar.');
        const plan=data.plan as Record<string,unknown>;
        const payload=JSON.stringify(plan);
        if(payload.length>32000)return err('too_large','Schaltplan ist für einen Aufruf zu gross.');
        const version=Number(s.version)||1;
        const switchTest=args.switchTest!==undefined;
        const operatingPoint=args.operatingPoint!==undefined;
        if(switchTest&&operatingPoint)return err('invalid_arguments','Pro Aufruf entweder Sollfolge prüfen oder Messwerte lesen.');
        if(args.expectedVersion!==undefined||switchTest||operatingPoint){
          if(expected(args.expectedVersion)!==version)
            return err('conflict','Schaltplan wurde geändert. Bitte erneut lesen.');
        }
        if(switchTest||operatingPoint){
          let report;
          try{
            report=switchTest?runSwitchTest(plan,args.switchTest):measureOperatingPoint(plan,args.operatingPoint);
          }catch(error){
            return err('invalid_arguments',error instanceof Error?error.message:'Prüfung konnte nicht ausgeführt werden.');
          }
          if(new TextEncoder().encode(JSON.stringify(report)).byteLength>32000)
            return err('too_large','Der Bericht ist zu gross. Einen kleineren Teilplan prüfen.');
          return {workspaceId:w,blockId:id,documentId:pageId,version,report};
        }
        return {workspaceId:w,blockId:id,documentId:pageId,
          version,plan,
          teile:Array.isArray(plan.teile)?plan.teile:[],
          leitungen:Array.isArray(plan.leitungen)?plan.leitungen:[],
          texte:Array.isArray(plan.texte)?plan.texte:[]};
      }
      const payload=JSON.stringify(sanitized);
      if(payload.length>12000)return err('too_large','Blockdaten sind zu gross.');
      return {workspaceId:w,blockId:id,documentId:pageId,
        version:Number(s.version)||1,type:data.type,text:String(data.text||'').slice(0,12000),
        data:sanitized,children:visibleChildrenIds,
        childrenTruncated:selection.nextOffset!==null,nextChildOffset:selection.nextOffset};
    }
    if(name==='redion_list_tasks'){
      if(args.nurOffen!==undefined&&typeof args.nurOffen!=='boolean')
        return err('invalid_arguments','nurOffen muss true oder false sein.');
      const max=limit(args.limit,30,40);
      const offset=args.offset===undefined?0:args.offset;
      if(!Number.isSafeInteger(offset)||Number(offset)<0||Number(offset)>1000)
        return err('invalid_arguments','Ungültiger Aufgabenversatz.');
      type Task={taskId:string;title:string;fertig:boolean;art:'block'|'zeile';
        pageId?:string;databaseId?:string;databaseName?:string;status?:string;
        faellig?:string;version:number;sort:string};
      const tasks:Task[]=[];
      const isDone=(value:string)=>/erledigt|fertig|done|abgeschlossen|completed/i.test(value);
      const asValue=(value:unknown):unknown=>{
        if(value&&typeof value==='object'&&!Array.isArray(value)){
          const v=value as Record<string,unknown>;
          return v.name??v.value??v.status??value;
        }
        return value;
      };
      const isChecked=(value:unknown)=>value===true||value===1||value==='true';
      // The sync adapter stores the actual containing page in s.seite for
      // todo blocks. Check the page itself, never infer permission from the
      // mere existence of a raw block in D1.
      const todos=await db.prepare(
        "SELECT id,seite,daten,version,geaendert FROM saetze "+
        "WHERE bereich=?1 AND tabelle='blocks' AND geloescht=0 AND verschluesselt=0 "+
        "AND CASE WHEN json_valid(daten) THEN json_extract(daten,'$.type')='todo' ELSE 0 END "+
        "ORDER BY geaendert DESC,id DESC LIMIT 1500"
      ).bind(w).all<{id:string;seite:string|null;daten:string;version:number;geaendert:string}>();
      for(const entry of todos.results){
        if(!entry.seite)continue;
        try{await page(w,String(entry.seite),'lesen');}
        catch(error){if(error instanceof CloudMcpToolError)continue;throw error;}
        const data=JSON.parse(entry.daten) as Record<string,unknown>;
        if(data.archiviert===true||data.alive===false||typeof data.text!=='string'||!data.text.trim())continue;
        const fertig=isChecked(data.checked);
        if(args.nurOffen===true&&fertig)continue;
        tasks.push({taskId:entry.id,title:data.text.slice(0,250),fertig,art:'block',
          pageId:String(entry.seite),version:Number(entry.version)||1,sort:String(entry.geaendert||'')});
      }
      // Collection rows are only tasks when the collection has a readable
      // checkbox/status field and a readable embedding page. The collection's
      // sync "seite" is its own ID, not an authorization to read its rows.
      type Collection={id:string;name:string;statusKey?:string|undefined;checkboxKey?:string|undefined;
        dateKey?:string|undefined;titleVisible:boolean};
      const collections=new Map<string,Collection>();
      const collectionRows=await db.prepare(
        "SELECT id,daten FROM saetze WHERE bereich=?1 AND tabelle='collections' "+
        "AND geloescht=0 AND verschluesselt=0 AND json_valid(daten) "+
        "ORDER BY geaendert DESC,id DESC LIMIT 120"
      ).bind(w).all<{id:string;daten:string}>();
      for(const entry of collectionRows.results){
        let info:Record<string,unknown>;
        try{info=JSON.parse(entry.daten) as Record<string,unknown>;}catch{continue;}
        if(!info.schema||typeof info.schema!=='object'||Array.isArray(info.schema))continue;
        const schema=info.schema as Record<string,unknown>;
        const rights=await feldRechte(ablage,w,entry.id,userId);
        const columns=Object.entries(schema).map(([key,def])=>{
          const d=def&&typeof def==='object'&&!Array.isArray(def)?def as Record<string,unknown>:{};
          return {key,type:String(d.type||''),name:String(d.name||key),options:d.options};
        });
        const valid=(key:string)=>rights[key]!=='kein';
        const status=columns.find(c=>valid(c.key)&&c.type==='status')||
          columns.find(c=>valid(c.key)&&c.type==='select'&&Array.isArray(c.options)&&
            c.options.some((o:unknown)=>o&&typeof o==='object'&&
              isDone(String((o as Record<string,unknown>).name||''))));
        const checked=columns.find(c=>valid(c.key)&&c.type==='checkbox');
        if(!status&&!checked)continue;
        const links=await db.prepare(
          "SELECT seite FROM saetze WHERE bereich=?1 AND tabelle='blocks' "+
          "AND geloescht=0 AND verschluesselt=0 AND CASE WHEN json_valid(daten) THEN "+
          "(json_extract(daten,'$.type')='database' AND "+
          "json_extract(daten,'$.collectionId')=?2) ELSE 0 END LIMIT 64"
        ).bind(w,entry.id).all<{seite:string|null}>();
        let accessible=false;
        for(const link of links.results){
          if(!link.seite)continue;
          try{await page(w,String(link.seite),'lesen');accessible=true;break;}
          catch(error){if(!(error instanceof CloudMcpToolError))throw error;}
        }
        if(!accessible)continue;
        const titleKey=columns.find(c=>c.type==='title')?.key||'title';
        collections.set(entry.id,{id:entry.id,name:String(info.name||'Datenbank').slice(0,160),
          statusKey:status?.key,checkboxKey:checked?.key,
          dateKey:columns.find(c=>valid(c.key)&&c.type==='date')?.key,
          titleVisible:rights[titleKey]!=='kein'});
      }
      if(collections.size>0){
        const rows=await db.prepare(
          "SELECT id,seite,daten,version,geaendert FROM saetze "+
          "WHERE bereich=?1 AND tabelle='blocks' AND geloescht=0 AND verschluesselt=0 "+
          "AND CASE WHEN json_valid(daten) THEN "+
          "(json_extract(daten,'$.type')='page' AND "+
          "json_extract(daten,'$.parentTable')='collection') ELSE 0 END "+
          "ORDER BY geaendert DESC,id DESC LIMIT 2000"
        ).bind(w).all<{id:string;seite:string|null;daten:string;version:number;geaendert:string}>();
        for(const entry of rows.results){
          const info=JSON.parse(entry.daten) as Record<string,unknown>;
          const c=collections.get(String(info.parentId||''));
          if(!c||info.archiviert===true||info.alive===false)continue;
          try{await page(w,entry.id,'lesen');}
          catch(error){if(error instanceof CloudMcpToolError)continue;throw error;}
          const props=info.props&&typeof info.props==='object'&&!Array.isArray(info.props)?
            info.props as Record<string,unknown>:{};
          const statusValue=c.statusKey?asValue(props[c.statusKey]):'';
          const status=statusValue==null?'':typeof statusValue==='string'||typeof statusValue==='number'?
            String(statusValue):'';
          const fertig=c.checkboxKey?isChecked(asValue(props[c.checkboxKey])):isDone(status);
          if(args.nurOffen===true&&fertig)continue;
          const due=c.dateKey?asValue(props[c.dateKey]):null;
          tasks.push({taskId:entry.id,title:c.titleVisible?String(info.text||'').slice(0,250):'',
            fertig,art:'zeile',databaseId:c.id,databaseName:c.name,
            ...(c.statusKey?{status:status.slice(0,100)}:{}),
            ...(typeof due==='string'&&due.length<=40?{faellig:due}:{}),
            version:Number(entry.version)||1,sort:String(entry.geaendert||'')});
        }
      }
      tasks.sort((a,b)=>b.sort.localeCompare(a.sort)||b.taskId.localeCompare(a.taskId));
      return {workspaceId:w,tasks:tasks.slice(Number(offset),Number(offset)+max)
        .map(({sort,...rest})=>rest),
        nextOffset:tasks.length>Number(offset)+max?Number(offset)+max:null};
    }
    if(name==='redion_search'){
      await role(w,'*','lesen');
      if(args.query!==undefined&&(typeof args.query!=='string'||args.query.length>200))
        return err('invalid_arguments','Suchtext muss ein Text mit höchstens 200 Zeichen sein.');
      const query=typeof args.query==='string'?args.query.trim():'';
      // SQLite lower() handles ASCII but not general Unicode case folding.
      // For non-ASCII terms, scan a bounded set and compare in JavaScript.
      const unicodeTerm=/[^\x00-\x7f]/.test(query);
      const sqlNeedle=unicodeTerm?'':query;
      const foldedQuery=unicodeTerm?query.toLocaleLowerCase():'';
      const max=limit(args.limit,20,30);
      const offset=args.offset===undefined?0:args.offset;
      if(!Number.isSafeInteger(offset)||Number(offset)<0||Number(offset)>1000)
        return err('invalid_arguments','Ungültiger Suchversatz.');
      // The only searchable descendants are those reachable through EACH
      // parent's ordered content references. Parent IDs, page ownership,
      // deletion, encryption and collection membership are checked at every
      // level, not only on the final matching child.
      // Four levels and 1200 traversed nodes bound pathological graphs.
      // A cyclic, orphaned or detached block cannot become a search hit.
      const treeSql=(seed:string,rootId:string,workspaceId:string)=>{
        const children="json_each(CASE WHEN json_valid(parent.daten) THEN "+
          "CASE WHEN json_type(parent.daten,'$.content')='array' THEN "+
          "json_extract(parent.daten,'$.content') ELSE '[]' END ELSE '[]' END)";
        return "WITH RECURSIVE visible(id,daten,depth,path) AS ("+seed+
          " UNION ALL SELECT child.id,child.daten,parent.depth+1,"+
          "parent.path||child.id||',' FROM visible parent JOIN "+children+
          " ref JOIN saetze child ON child.id=ref.value AND child.bereich="+workspaceId+
          " WHERE parent.depth<4 AND ref.type='text' "+
          "AND length(ref.value) BETWEEN 1 AND 128 "+
          "AND child.tabelle='blocks' AND child.geloescht=0 AND child.verschluesselt=0 "+
          "AND child.seite="+rootId+" AND instr(parent.path,','||child.id||',')=0 "+
          "AND CASE WHEN json_valid(child.daten) THEN "+
          "(json_extract(child.daten,'$.parentId')=parent.id AND "+
          "COALESCE(json_extract(child.daten,'$.parentTable'),'')<>'collection' AND "+
          "COALESCE(json_extract(child.daten,'$.alive'),1)<>0 AND "+
          "json_extract(child.daten,'$.type') NOT IN ('page','database')) ELSE 0 END "+
          "LIMIT 1200) ";
      };
      const asciiSeed="SELECT p.id,p.daten,0,','||p.id||','";
      const asciiTree=treeSql(asciiSeed,"p.id","p.bereich");
      const childMatches="EXISTS ("+asciiTree+
        "SELECT 1 FROM visible WHERE depth>0 AND "+
        "instr(lower(COALESCE(json_extract(daten,'$.text'),'')),lower(?2))>0)";
      // Unicode fallback scans only after page authorization, never before.
      // It uses precisely the same traversal and visibility predicates.
      const unicodeSeed="SELECT id,daten,0,','||id||',' FROM saetze "+
        "WHERE bereich=?1 AND id=?2 AND tabelle='blocks' "+
        "AND geloescht=0 AND verschluesselt=0 AND json_valid(daten) "+
        "AND json_extract(daten,'$.type')='page'";
      const unicodeChildrenSql=treeSql(unicodeSeed,"?2","?1")+
        "SELECT daten FROM visible WHERE depth>0";
      const sql="SELECT p.id,p.seite,p.daten,p.version FROM saetze p "+
        "WHERE p.bereich=?1 AND p.tabelle='blocks' AND p.geloescht=0 AND p.verschluesselt=0 "+
        "AND CASE WHEN json_valid(p.daten) THEN "+
        "(json_extract(p.daten,'$.type')='page' AND "+
        "COALESCE(json_extract(p.daten,'$.parentTable'),'')<>'collection' AND "+
        "(json_extract(p.daten,'$.archiviert') IS 1)=?5 AND ("+
        "?2='' OR instr(lower(COALESCE(json_extract(p.daten,'$.text'),'')),lower(?2))>0 "+
        "OR instr(lower(COALESCE(json_extract(p.daten,'$.inhalt'),'')),lower(?2))>0 "+
        "OR "+childMatches+")) ELSE 0 END "+
        "ORDER BY p.geaendert DESC,p.id DESC LIMIT ?3 OFFSET ?4";
      const found:{documentId:string;title:string;version:number}[]=[];
      const archived=archiveFlag(args.archived);
      const batch=100,maxScanned=2000;
      let scanned=0,visible=0;
      while(scanned<maxScanned&&found.length<=max){
        const result=await db.prepare(sql).bind(w,sqlNeedle,batch,scanned,archived)
          .all<{id:string;seite:string|null;daten:string;version:number}>();
        for(const s of result.results){
          const r=await rolleAuf(ablage,w,String(s.seite||s.id),userId);
          if(!darf(r,'lesen'))continue;
          // Unicode-aware comparison occurs ONLY after the ACL check.
          const data=JSON.parse(s.daten) as Record<string,unknown>;
          if(unicodeTerm&&!String(data.text||'').toLocaleLowerCase().includes(foldedQuery)&&
             !String(data.inhalt||'').toLocaleLowerCase().includes(foldedQuery)){
            const children=await db.prepare(unicodeChildrenSql).bind(w,s.id)
              .all<{daten:string}>();
            const matched=children.results.some(child=>{
              try{
                const row=JSON.parse(child.daten) as Record<string,unknown>;
                return typeof row.text==='string'&&
                  row.text.toLocaleLowerCase().includes(foldedQuery);
              }catch{return false;}
            });
            if(!matched)continue;
          }
          if(visible++<Number(offset))continue;
          found.push({documentId:s.id,title:String(data.text||'').slice(0,160),version:Number(s.version)||1});
          if(found.length>max)break;
        }
        scanned+=result.results.length;
        if(result.results.length<batch)break;
      }
      // No raw-row truncation marker: that could disclose the existence of
      // content that the caller is explicitly forbidden to read.
      return {documents:found.slice(0,max),nextOffset:found.length>max?Number(offset)+max:null};
    }
    if(name==='redion_update_database_rows'){
      if(Object.keys(args).some(key=>!['workspaceId','databaseId','databaseBlockId','expectedDatabaseVersion','changes'].includes(key)))
        return err('invalid_arguments','Unbekanntes Feld für die Datenbankbearbeitung.');
      const databaseId=required(args.databaseId,128),blockId=required(args.databaseBlockId,128);
      const databaseVersion=expected(args.expectedDatabaseVersion);
      let changes:ReturnType<typeof parseDatabaseChanges>;
      try{changes=parseDatabaseChanges(args.changes);}
      catch(error){return err('invalid_arguments',(error as Error).message);}
      const block=await ablage.hole('saetze',{bereich:w,id:blockId});
      if(!block||block.tabelle!=='blocks'||block.geloescht||block.verschluesselt||!block.seite)
        return err('not_found','Datenbankblock nicht verfügbar.');
      const pageId=String(block.seite);
      await page(w,pageId,'bearbeiten');
      let link:Args;
      try{link=JSON.parse(String(block.daten));}
      catch{return err('not_found','Datenbankblock nicht verfügbar.');}
      if(!link||link.type!=='database'||link.collectionId!==databaseId||link.alive===false||
          link.archiviert===true||link.gesperrt===true||link.parentTable==='collection')
        return err('not_found','Datenbankblock nicht verfügbar.');
      const ancestors=await embedding(w,pageId,blockId,link);
      const database=await ablage.hole('saetze',{bereich:w,id:databaseId});
      if(!database||database.tabelle!=='collections'||database.geloescht||database.verschluesselt)
        return err('not_found','Datenbank nicht verfügbar.');
      if(Number(database.version)!==databaseVersion)return err('conflict','Datenbankschema wurde geändert.');
      let schema:Args;
      try{schema=JSON.parse(String(database.daten))?.schema;}
      catch{return err('invalid_data','Datenbankschema ist ungültig.');}
      if(!schema||typeof schema!=='object'||Array.isArray(schema))return err('invalid_data','Datenbankschema ist ungültig.');
      const fields=[...new Set(changes.flatMap(change=>change.values.map(([key])=>key)))];
      if(!fields.includes('title')&&fields.some(key=>(schema[key] as Args|undefined)?.type==='title'))fields.push('title');
      const rights=await feldRechte(ablage,w,databaseId,userId);
      if(fields.some(key=>Object.hasOwn(rights,key)&&rights[key]!=='voll'))
        return err('forbidden','Mindestens eine Spalte ist schreibgeschützt.');
      const rows=await db.prepare(readWritableDatabaseRowsSql).bind(
        JSON.stringify(changes.map(change=>({id:change.rowId}))),w,userId,pageId
      ).all<{id:string;version:number;daten:string}>();
      const byId=new Map(rows.results.map(row=>[row.id,row]));
      const now=new Date().toISOString(),encoder=new TextEncoder();
      const updates=[];
      for(const change of changes){
        const row=byId.get(change.rowId);
        if(!row)return err('not_found','Datenbankzeile nicht verfügbar.');
        let data:Args;
        try{data=JSON.parse(row.daten);}
        catch{return err('invalid_data','Datenbankzeile ist ungültig.');}
        if(!data||data.type!=='page'||data.parentTable!=='collection'||data.parentId!==databaseId||
            data.alive===false||data.archiviert===true||data.gesperrt===true)
          return err('not_found','Datenbankzeile nicht verfügbar.');
        if(Number(row.version)!==change.expectedVersion)return err('conflict','Eine Datenbankzeile wurde geändert.');
        let payload:string;
        try{payload=JSON.stringify(applyDatabaseValues(data,schema,change.values,now));}
        catch(error){return err('invalid_arguments',(error as Error).message);}
        if(encoder.encode(payload).byteLength>48000)return err('too_large','Eine Datenbankzeile überschreitet das Schreiblimit.');
        updates.push({id:change.rowId,version:change.expectedVersion,payload});
      }
      const saved=await db.prepare(updateDatabaseRowsSql).bind(JSON.stringify(updates),w,userId,pageId,databaseId,
        databaseVersion,JSON.stringify([{id:blockId,version:Number(block.version)},...ancestors]),JSON.stringify(fields),now)
        .all<{id:string;version:number}>();
      if(saved.results.length!==updates.length)return err('conflict','Daten, Einbettung oder Berechtigungen wurden zwischenzeitlich geändert.');
      const versions=new Map(saved.results.map(row=>[row.id,row.version]));
      await notieren(ablage,{bereich:w,kontoId:userId,art:'mcp',text:'Datenbankzeilen über Cloud-MCP bearbeitet',objekt:databaseId});
      return {workspaceId:w,databaseId,databaseVersion,rows:updates.map(row=>({rowId:row.id,version:versions.get(row.id)}))};
    }
    if(name==='redion_read_database'){
      const databaseId=required(args.databaseId,128);
      const requestedLimit=limit(args.limit,10,500);
      const max=Math.min(10,requestedLimit);
      const offset=args.offset===undefined?0:args.offset;
      if(!Number.isSafeInteger(offset)||Number(offset)<0||Number(offset)>1000)
        return err('invalid_arguments','Ungültiger Datenbankversatz.');
      const database=await ablage.hole('saetze',{bereich:w,id:databaseId});
      if(!database||database.tabelle!=='collections'||database.geloescht||database.verschluesselt)
        return err('not_found','Datenbank nicht verfügbar.');
      let data:Record<string,unknown>;
      try{data=JSON.parse(String(database.daten||''));}
      catch{return err('not_found','Datenbank nicht verfügbar.');}
      if(!data||!data.schema||typeof data.schema!=='object'||Array.isArray(data.schema))
        return err('not_found','Datenbank nicht verfügbar.');
      // A collection's synced "seite" is its own ID, not its owning page.
      // Only an actual, cleartext database block on a READABLE page permits
      // access. A direct collection ID is not an authorization token.
      const links=await db.prepare(
        "SELECT seite FROM saetze WHERE bereich=?1 AND tabelle='blocks' "+
        "AND geloescht=0 AND verschluesselt=0 AND CASE WHEN json_valid(daten) THEN "+
        "(json_extract(daten,'$.type')='database' AND "+
        "json_extract(daten,'$.collectionId')=?2) ELSE 0 END LIMIT 64"
      ).bind(w,databaseId).all<{seite:string|null}>();
      let readable=false;
      for(const link of links.results){
        if(!link.seite)continue;
        try{await page(w,String(link.seite),'lesen');readable=true;break;}
        catch(e){if(!(e instanceof CloudMcpToolError))throw e;}
      }
      if(!readable)return err('not_found','Datenbank nicht verfügbar.');
      const rights=await feldRechte(ablage,w,databaseId,userId);
      const cols=Object.entries(data.schema as Record<string,unknown>)
        .filter(([key])=>rights[key]!=='kein'&&!['__proto__','prototype','constructor'].includes(key))
        .map(([key,def])=>{
          const x=def&&typeof def==='object'&&!Array.isArray(def)?def as Record<string,unknown>:{};
          return {key,name:String(x.name||key).slice(0,120),type:String(x.type||'text').slice(0,40)};
        });
      if(cols.length>40)return err('too_large','Diese Datenbank hat mehr als 40 sichtbare Spalten.');
      const columns=new Set(cols.map(x=>x.key));
      // Iterate raw candidates but only count rows after ACL checks. Never
      // expose hidden rows through raw SQL LIMIT/OFFSET.
      const sql="SELECT id,seite,daten,version FROM saetze "+
        "WHERE bereich=?1 AND tabelle='blocks' AND geloescht=0 AND verschluesselt=0 "+
        "AND CASE WHEN json_valid(daten) THEN "+
        "(json_extract(daten,'$.type')='page' AND "+
        "json_extract(daten,'$.parentTable')='collection' AND "+
        "json_extract(daten,'$.parentId')=?2) ELSE 0 END "+
        "ORDER BY geaendert DESC,id DESC LIMIT ?3 OFFSET ?4";
      const rows:{rowId:string;title:string;values:Record<string,unknown>;version:number}[]=[];
      let scanned=0,visible=0;
      const batch=50,maxScanned=2000;
      while(scanned<maxScanned&&rows.length<=max){
        const result=await db.prepare(sql).bind(w,databaseId,batch,scanned)
          .all<{id:string;seite:string|null;daten:string;version:number}>();
        for(const s of result.results){
          const r=await rolleAuf(ablage,w,String(s.seite||s.id),userId);
          if(!darf(r,'lesen'))continue;
          if(visible++<Number(offset))continue;
          const item=JSON.parse(s.daten) as Record<string,unknown>;
          const raw=item.props&&typeof item.props==='object'&&!Array.isArray(item.props)?
            item.props as Record<string,unknown>:{};
          const values=Object.fromEntries(Object.entries(raw).filter(([key])=>columns.has(key))
            .map(([key,value])=>{
              const rawValue=JSON.stringify(value);
              return [key,rawValue&&rawValue.length<=500?value:{truncated:true}];
            }));
          rows.push({rowId:s.id,title:rights['title']==='kein'?'':String(item.text||'').slice(0,160),
            values,version:Number(s.version)||1});
          if(rows.length>max)break;
        }
        scanned+=result.results.length;
        if(result.results.length<batch)break;
      }
      return {workspaceId:w,databaseId,name:String(data.name||'').slice(0,160),
        version:Number(database.version)||1,columns:cols,rows:rows.slice(0,max),
        requestedLimit,effectiveLimit:max,limitCapped:requestedLimit>max,
        nextOffset:rows.length>max?Number(offset)+max:null};
    }
    if(name==='redion_list_databases'){
      const max=limit(args.limit,20,30);
      const offset=args.offset===undefined?0:args.offset;
      if(!Number.isSafeInteger(offset)||Number(offset)<0||Number(offset)>1000)
        return err('invalid_arguments','Ungültiger Datenbankversatz.');
      // "collections" rows do NOT carry their actual owning page:
      // the sync adapter stores seite=collectionId. Only a valid database
      // block points to an actual page, and that page must be readable.
      // Distinct visible collections count for pagination, never raw rows.
      const sql="SELECT c.id,c.daten,c.version,b.seite AS pageId "+
        "FROM saetze c JOIN saetze b ON b.bereich=c.bereich "+
        "AND b.tabelle='blocks' AND b.geloescht=0 AND b.verschluesselt=0 "+
        "AND CASE WHEN json_valid(b.daten) THEN "+
        "(json_extract(b.daten,'$.type')='database' AND "+
        "json_extract(b.daten,'$.collectionId')=c.id) ELSE 0 END "+
        "WHERE c.bereich=?1 AND c.tabelle='collections' "+
        "AND c.geloescht=0 AND c.verschluesselt=0 AND json_valid(c.daten) "+
        "ORDER BY c.geaendert DESC,c.id DESC,b.id DESC LIMIT ?2 OFFSET ?3";
      const found:{databaseId:string;name:string;pageId:string;version:number}[]=[];
      const seen=new Set<string>(),batch=60,maxScanned=2000;
      let scanned=0,visible=0;
      while(scanned<maxScanned&&found.length<=max){
        const result=await db.prepare(sql).bind(w,batch,scanned)
          .all<{id:string;daten:string;version:number;pageId:string|null}>();
        for(const s of result.results){
          if(seen.has(s.id))continue;
          const pageId=typeof s.pageId==='string'?s.pageId:'';
          if(!pageId)continue;
          try{await page(w,pageId,'lesen');}
          catch(error){
            if(error instanceof CloudMcpToolError)continue;
            throw error;
          }
          seen.add(s.id);
          if(visible++<Number(offset))continue;
          const data=JSON.parse(s.daten) as Record<string,unknown>;
          found.push({databaseId:s.id,name:String(data.name||'').slice(0,160),
            pageId,version:Number(s.version)||1});
          if(found.length>max)break;
        }
        scanned+=result.results.length;
        if(result.results.length<batch)break;
      }
      return {workspaceId:w,databases:found.slice(0,max),
        nextOffset:found.length>max?Number(offset)+max:null};
    }
    if(name==='redion_read_pages'){
      const raw=args.documentIds;
      if(!Array.isArray(raw)||raw.length<1||raw.length>10)
        return err('invalid_arguments','Es sind 1 bis 10 Seitenkennungen erforderlich.');
      const ids=raw.map(id=>required(id,128));
      if(new Set(ids).size!==ids.length)
        return err('invalid_arguments','Seitenkennungen dürfen nicht doppelt vorkommen.');
      const max=limit(args.maxChars,2000,2000);
      const documents=[];
      for(const id of ids){
        try{
          const result=await page(w,id,'lesen');
          const content=String(result.data.inhalt||'');
          let end=Math.min(max,content.length);
          const last=content.charCodeAt(end-1),next=content.charCodeAt(end);
          if(end<content.length&&last>=0xD800&&last<=0xDBFF&&next>=0xDC00&&next<=0xDFFF)end++;
          documents.push({documentId:id,title:String(result.data.text||'').slice(0,160),
            content:content.slice(0,end),version:Number(result.s.version)||1,
            totalLength:content.length,nextOffset:end<content.length?end:null});
        }catch(error){
          // Missing, forbidden, encrypted and invalid page records must look
          // identical; otherwise the batch would disclose hidden page IDs.
          if(!(error instanceof CloudMcpToolError))throw error;
          documents.push({documentId:id,unavailable:true});
        }
      }
      return {workspaceId:w,documents};
    }
    if(name==='redion_get_page_path'){
      const id=required(args.documentId,128);
      const path:{documentId:string;title:string;version:number}[]=[];
      const visited=new Set<string>();
      let cursor=id,complete=false;
      for(let depth=0;depth<40;depth++){
        if(visited.has(cursor))return err('invalid_data','Zyklischer Seitenpfad.');
        visited.add(cursor);
        let item:Awaited<ReturnType<typeof page>>;
        try{item=await page(w,cursor,'lesen');}
        catch(error){
          // Never expose any ancestor ID, title, depth or denial reason
          // if a directly shared child has an unreadable parent.
          if(error instanceof CloudMcpToolError&&cursor!==id)
            return {workspaceId:w,documentId:id,unavailable:true};
          throw error;
        }
        path.push({documentId:cursor,title:String(item.data.text||'').slice(0,160),
          version:Number(item.s.version)||1});
        const parent=item.data.parentId;
        if(parent===null||parent===undefined||parent===''){complete=true;break;}
        if(typeof parent!=='string'||parent.length>128||!parent.trim())
          return err('invalid_data','Ungültiger Seitenpfad.');
        cursor=parent;
      }
      if(!complete)return err('invalid_data','Seitenpfad ist zu tief.');
      return {workspaceId:w,documentId:id,path:path.reverse()};
    }
    if(name==='redion_read_page'){
      const id=required(args.documentId,128);
      const result=await page(w,id,'lesen');
      if(args.expectedVersion!==undefined&&expected(args.expectedVersion)!==Number(result.s.version||1))
        return err('conflict','Seite hat sich seit dem letzten Leseabschnitt geändert. Bitte neu beginnen.');
      const offset=args.offset===undefined?0:args.offset;
      if(!Number.isSafeInteger(offset)||Number(offset)<0)
        return err('invalid_arguments','Ungültiger Leseversatz.');
      const max=limit(args.limit,12000,12000);
      const full=String(result.data.inhalt||'');
      const start=Number(offset);
      if(start>full.length)return err('invalid_arguments','Leseversatz liegt hinter dem Seitenende.');
      // Avoid splitting a surrogate pair, which would corrupt emoji and other
      // non-BMP Unicode characters when a large document is read in chunks.
      const previous=full.charCodeAt(start-1),atStart=full.charCodeAt(start);
      if(start>0&&previous>=0xD800&&previous<=0xDBFF&&atStart>=0xDC00&&atStart<=0xDFFF)
        return err('invalid_arguments','Leseversatz liegt mitten in einem Unicode-Zeichen.');
      let end=Math.min(full.length,start+max);
      const last=full.charCodeAt(end-1),next=full.charCodeAt(end);
      if(end<full.length&&last>=0xD800&&last<=0xDBFF&&next>=0xDC00&&next<=0xDFFF)end++;
      const base={documentId:id,workspaceId:w,title:String(result.data.text||''),
        version:Number(result.s.version)||1,offset:start,totalLength:full.length,
        nextOffset:end<full.length?end:null,
        ...(typeof result.data.archiviert==='boolean'?{archived:result.data.archiviert}:{}),
        // Structural hint only: do not reveal the number or IDs of hidden children.
        blockStorage:Array.isArray(result.data.content)?'referenced':'none'};
      const part=full.slice(start,end);
      const blockOffset=args.blockOffset===undefined?0:args.blockOffset;
      if(!Number.isSafeInteger(blockOffset)||Number(blockOffset)<0||
        Number(blockOffset)>100000)
        return err('invalid_arguments','Ungültiger Blockversatz.');
      const blockLimit=limit(args.blockLimit,20,20);
      // This is a preview, not a conversion into Markdown. A page may have
      // an empty Markdown field and still contain hundreds of valid blocks.
      const preview=base.blockStorage==='referenced'?
        await visibleChildren(w,id,id,result.data.content,Number(blockOffset),blockLimit):
        {rows:[],nextOffset:null};
      const blockPreview=preview.rows.map(row=>{
        const info=JSON.parse(row.daten) as Record<string,unknown>;
        const fullText=typeof info.text==='string'?info.text:'';
        return {blockId:row.id,type:info.type,text:fullText.slice(0,500),
          textTruncated:fullText.length>500,version:Number(row.version)||1};
      });
      const previewFields={blockPreview,nextBlockOffset:preview.nextOffset,
        blockPreviewTruncated:preview.nextOffset!==null};

      // Some ChatGPT app adapters interpret a top-level "content" property
      // as the MCP transport envelope and silently drop the tool result.
      // Use an unambiguous field name by default; keep an explicit legacy
      // response for existing consumers that expect .content.
      if(args.responseFormat!==undefined&&args.responseFormat!=='portable'&&args.responseFormat!=='legacy')
        return err('invalid_arguments','Unbekanntes Seiten-Antwortformat.');
      return args.responseFormat==='legacy'?{...base,...previewFields,content:part}:
        {...base,...previewFields,markdown:part};
    }
    if(name==='redion_list_child_pages'||name==='redion_list_root_pages'){
      const root=name==='redion_list_root_pages';
      const parentId=root?'':required(args.parentId,128);
      if(!root)await page(w,parentId,'lesen');
      const max=limit(args.limit,50,100);
      const archived=archiveFlag(args.archived);
      const offset=args.offset===undefined?0:args.offset;
      if(!Number.isSafeInteger(offset)||Number(offset)<0||Number(offset)>100000)
        return err('invalid_arguments','Ungültiger Seitenversatz.');
      // Every returned page is permission-filtered BEFORE SQL pagination.
      // The root view has no inherited parent grant: fall back to the
      // workspace grant. Child pages inherit the verified parent's grant.
      const parentWhere=root?
        "COALESCE(json_extract(s.daten,'$.parentId'),'')=?2":
        "json_extract(s.daten,'$.parentId')=?2";
      const pageRole=(account:string)=>
        "(SELECT CASE WHEN f.rolle IN ('voll','edit','komm','lesen') THEN 1 ELSE 0 END "+
        "FROM freigaben AS f WHERE f.bereich=s.bereich "+
        "AND f.seite=COALESCE(NULLIF(s.seite,''),s.id) AND f.kontoId="+account+")";
      const workspaceRole=(account:string)=>
        "(SELECT CASE WHEN f.rolle IN ('voll','edit','komm','lesen') THEN 1 ELSE 0 END "+
        "FROM freigaben AS f WHERE f.bereich=s.bereich AND f.seite='*' AND f.kontoId="+account+")";
      const fallback=root?
        workspaceRole('?6')+","+workspaceRole("'*'")+",0":"1";
      const rows=await db.prepare(
        "SELECT s.id,s.seite,s.daten,s.version FROM saetze AS s "+
        "WHERE s.bereich=?1 AND s.tabelle='blocks' AND s.geloescht=0 AND s.verschluesselt=0 "+
        "AND CASE WHEN json_valid(s.daten) THEN "+
        "(json_extract(s.daten,'$.type')='page' AND "+parentWhere+
        " AND COALESCE(json_extract(s.daten,'$.parentTable'),'')<>'collection'"+
        " AND (json_extract(s.daten,'$.archiviert') IS 1)=?7) "+
        "ELSE 0 END AND (?5=1 OR COALESCE("+
        pageRole('?6')+","+pageRole("'*'")+","+fallback+
        ")=1) ORDER BY s.geaendert DESC,s.id DESC LIMIT ?3 OFFSET ?4"
      ).bind(w,parentId,max+1,Number(offset),area.besitzer===userId?1:0,userId,archived)
        .all<{id:string;seite:string|null;daten:string;version:number}>();
      const documents=[];
      for(const s of rows.results.slice(0,max)){
        const r=await rolleAuf(ablage,w,String(s.seite||s.id),userId);
        if(!darf(r,'lesen'))continue;
        const data=JSON.parse(s.daten) as Record<string,unknown>;
        documents.push({documentId:s.id,title:String(data.text||'').slice(0,160),version:Number(s.version)||1});
      }
      // If the definitive ACL check rejects a row, do not reveal where
      // additional hidden pages may exist through nextOffset.
      const allVisible=documents.length===Math.min(rows.results.length,max);
      const nextOffset=allVisible&&rows.results.length>max?Number(offset)+max:null;
      return root?{workspaceId:w,documents,nextOffset}:{parentId,documents,nextOffset};
    }
    if(name==='redion_read_visual'||name==='redion_update_visual'){
      const id=required(args.blockId,128),writing=name==='redion_update_visual';
      const s=await ablage.hole('saetze',{bereich:w,id});
      if(!s||s.tabelle!=='blocks'||s.geloescht||s.verschluesselt)return err('not_found','Zeichenobjekt nicht verfügbar.');
      const pageId=required(s.seite,128);await page(w,pageId,writing?'bearbeiten':'lesen');
      let data:Record<string,unknown>;try{data=JSON.parse(String(s.daten));}catch{return err('not_found','Zeichenobjekt nicht verfügbar.');}
      if(!data||!['mindmap','whiteboard','blatt','pdfseite'].includes(String(data.type))||data.parentTable==='collection'||data.alive===false||data.archiviert===true)return err('not_found','Zeichenobjekt nicht verfügbar.');
      const ancestors=await embedding(w,pageId,id,data);
      const type=String(data.type),version=Number(s.version)||1;
      const hasMarks=type==='blatt'||type==='pdfseite';
      if(!writing){
        if(args.expectedVersion!==undefined&&expected(args.expectedVersion)!==version)
          return err('conflict','Zeichenobjekt wurde geändert. Bitte ab der ersten Seite neu lesen.');
        if(args.collection!==undefined||args.offset!==undefined||args.limit!==undefined){
          const collection=args.collection===undefined?(type==='mindmap'?'nodes':hasMarks?'marks':'shapes'):args.collection;
          const offset=args.offset===undefined?0:args.offset;
          if(typeof offset!=='number'||!Number.isSafeInteger(offset)||offset<0||offset>100000)
            return err('invalid_arguments','Ungültiger Zeichenobjektversatz.');
          if(offset&&args.expectedVersion===undefined)
            return err('invalid_arguments','Für Folgeseiten ist expectedVersion erforderlich.');
          const max=limit(args.limit,20,40);
          let elements:unknown;
          if(type==='whiteboard'&&collection==='shapes')elements=data.shapes??[];
          else if(hasMarks&&collection==='marks')elements=data.marken??[];
          else if(type==='pdfseite'&&collection==='pdf_text'){
            const characters=Array.from(typeof data.suchtext==='string'?data.suchtext:'');
            elements=Array.from({length:Math.ceil(characters.length/500)},(_,i)=>characters.slice(i*500,(i+1)*500).join(''));
          }
          else if(type==='mindmap'&&(collection==='nodes'||collection==='connections')){
            const map=data.karte as Record<string,unknown>|undefined;
            elements=map?.[collection==='nodes'?'knoten':'verbindungen'];
          }else return err('invalid_arguments','Diese Liste passt nicht zum Blocktyp.');
          if(!Array.isArray(elements))return err('invalid_data','Ungültige Elemente im Zeichenobjekt.');
          const encoder=new TextEncoder();
          let bytes=2;
          const items:unknown[]=[];
          for(const raw of elements.slice(offset,offset+max)){
            const element=collection==='marks'?readSheetMark(raw):raw;
            const size=encoder.encode(JSON.stringify(element)).byteLength+(items.length?1:0);
            if(bytes+size>28000){
              if(!items.length)return err('too_large','Ein einzelnes Zeichenelement ist zu gross.');
              break;
            }
            items.push(element);
            bytes+=size;
          }
          const nextOffset=offset+items.length<elements.length?offset+items.length:null;
          return {workspaceId:w,documentId:pageId,blockId:id,type,version,collection,offset,nextOffset,items,
            ...(collection==='marks'?{coordinateSpace:data.raumVersion===1?'sheetPoints':'legacy'}:{})};
        }
        if(type==='pdfseite')return {workspaceId:w,documentId:pageId,blockId:id,type,version,
          width:typeof data.bw==='number'?data.bw:null,height:typeof data.bh==='number'?data.bh:null,
          pageNumber:Number.isSafeInteger(data.nr)?data.nr:null,pageCount:Number.isSafeInteger(data.vonSeiten)?data.vonSeiten:null,
          rotation:data.gedreht===90||data.gedreht===180||data.gedreht===270?data.gedreht:0,
          hasText:typeof data.suchtext==='string'&&data.suchtext.length>0};
        const view=type==='mindmap'?{karte:data.karte??null}:type==='whiteboard'?{shapes:data.shapes??[],sicht:data.sicht??null}:{papier:data.papier??'blanko',blattBreite:data.blattBreite??595.28,blattHoehe:data.blattHoehe??841.89,
          ...(data.blattAusrichtung==='quer'?{orientation:'landscape'}:{})};
        if(new TextEncoder().encode(JSON.stringify(view)).byteLength>32000)return err('too_large','Zeichenobjekt zu gross. Knoten, Verbindungen oder Formen seitenweise lesen.');
        return {workspaceId:w,documentId:pageId,blockId:id,type,version,...view};
      }
      if(expected(args.expectedVersion)!==version)return err('conflict','Zeichenobjekt wurde geändert.');
      const op=args.operation,next={...data};
      const fields:Record<string,string[]>={replace_mindmap:['nodes','connections','layout','camera'],rename_node:['elementId','text'],style_node:['elementId','color','form','collapsed'],delete_branch:['elementId'],append_shapes:['shapes'],move_shape:['elementId','x','y'],resize_shape:['elementId','width','height'],style_shape:['elementId','color','filled','text','strokeWidth','marker'],delete_shape:['elementId'],rotate_shape:['elementId','rotation'],order_shape:['elementId','order'],lock_shape:['elementId','locked'],move_stroke:['elementId','dx','dy'],set_paper:['paper'],
        group_selection:['selection','groupId'],ungroup_selection:['selection'],align_selection:['selection','alignment'],
        move_selection:['selection','dx','dy'],order_selection:['selection','order'],
        append_node:['node'],move_node:['elementId','parentId'],add_connection:['connection'],remove_connection:['elementId'],append_marks:['marks'],move_mark:['elementId','dx','dy']};
      if(typeof op!=='string'||!Object.hasOwn(fields,op)||Object.keys(args).some(k=>!['workspaceId','blockId','expectedVersion','operation',...fields[op]!].includes(k)))return err('invalid_arguments','Ungültige Operation.');
      try{
        if(type==='mindmap'&&op==='replace_mindmap')next.karte=mindmap(args.nodes,args.connections,args.layout,args.camera);
        else if(type==='mindmap'&&mindmapEditOperations.includes(op))next.karte=editNode(data.karte,op,args);
        else if(type==='whiteboard'&&shapeSelectionOperations.includes(op)){
          next.shapes=editSelection(data.shapes,op,args);next.raumVersion=1;
        }
        else if(type==='whiteboard'&&['move_shape','resize_shape','style_shape','delete_shape','rotate_shape','order_shape','lock_shape','move_stroke'].includes(op)){next.shapes=editShape(data.shapes,op,args);next.raumVersion=1;}
        else if(type==='whiteboard'&&op==='append_shapes'){
          const existing=data.shapes??[];if(!Array.isArray(existing)||existing.some(s=>!s||typeof s!=='object'||Array.isArray(s)))return err('invalid_data','Ungültige Formen.');
          next.shapes=[...existing,...board(args.shapes,existing)];next.raumVersion=1;
        }else if(type==='blatt'&&op==='set_paper'){
          if(typeof args.paper!=='string'||!papers.includes(args.paper))return err('invalid_arguments','Unbekanntes Papier.');next.papier=args.paper;
        }else if(hasMarks&&op==='append_marks'){
          next.marken=appendSheetMarks(data,args.marks);next.raumVersion=1;
        }else if(hasMarks&&op==='move_mark'){
          next.marken=moveSheetMark(data,args);
        }else return err('invalid_arguments','Operation passt nicht zum Blocktyp.');
      }catch(error){return err('invalid_arguments',error instanceof Error?error.message:'Ungültige Zeichnung.');}
      const now=new Date().toISOString(),payload=JSON.stringify({...next,edited:now});
      if(new TextEncoder().encode(payload).byteLength>48000)return err('too_large','Zeichenobjekt zu gross.');
      const updated=await db.prepare(
        "UPDATE saetze SET daten=?1,version=version+1,geaendert=?2,vonGeraet='Cloud-MCP' "+
        "WHERE bereich=?3 AND id=?4 AND tabelle='blocks' AND seite=?5 AND version=?6 "+
        'AND verschluesselt=0 AND geloescht=0 AND daten=?7 '+
        unchangedEmbedding('?8')+'RETURNING version'
      ).bind(payload,now,w,id,pageId,version,String(s.daten),JSON.stringify(ancestors)).first<{version:number}>();
      if(!updated)return err('conflict','Zeichenobjekt wurde zwischenzeitlich geändert.');
      await notieren(ablage,{bereich:w,kontoId:userId,art:'mcp',text:'Zeichenobjekt über Cloud-MCP bearbeitet',objekt:id});
      return {workspaceId:w,documentId:pageId,blockId:id,type,version:updated.version};
    }
    if(!principal.scopes.includes('redion:write'))
      return err('forbidden','Schreibrechte sind nicht freigegeben.');
    if(name==='redion_update_block'){
      const id=required(args.blockId,128);
      const ver=expected(args.expectedVersion);
      const s=await ablage.hole('saetze',{bereich:w,id});
      if(!s||s.tabelle!=='blocks'||s.geloescht)return err('not_found','Block nicht verfügbar.');
      const pageId=required(s.seite,128);
      // Check the owning page BEFORE exposing any of the block's metadata.
      await page(w,pageId,'bearbeiten');
      if(s.verschluesselt)return err('encrypted','Verschlüsselte Blöcke nicht in der Cloud bearbeiten.');
      let data:Record<string,unknown>;
      try{data=JSON.parse(String(s.daten||'')) as Record<string,unknown>;}
      catch{return err('not_found','Block nicht verfügbar.');}
      const blockTypes=new Set(['text','h1','h2','h3','todo','bullet','number','quote','code']);
      if(!data||typeof data!=='object'||Array.isArray(data)||!blockTypes.has(String(data.type))||
        data.parentTable==='collection'||data.alive===false||data.archiviert===true)
        return err('not_found','Block ist für diese Bearbeitung nicht verfügbar.');
      // A forged/orphaned block ID may still contain an existing page in s.seite.
      // Walk every ancestor's actual content list and verify its parentId.
      let childId=id,ancestorId=required(data.parentId,128),valid=false;
      const seen=new Set<string>([id]);
      for(let depth=0;depth<40;depth++){
        if(seen.has(ancestorId))break;
        seen.add(ancestorId);
        const ancestor=await ablage.hole('saetze',{bereich:w,id:ancestorId});
        if(!ancestor||ancestor.tabelle!=='blocks'||ancestor.geloescht||
          ancestor.verschluesselt||ancestor.seite!==pageId)break;
        let parentData:Record<string,unknown>;
        try{parentData=JSON.parse(String(ancestor.daten||'')) as Record<string,unknown>;}
        catch{break;}
        if(!parentData||typeof parentData!=='object'||Array.isArray(parentData)||
          parentData.alive===false||parentData.parentTable==='collection'||
          !Array.isArray(parentData.content)||!parentData.content.includes(childId))break;
        if(ancestorId===pageId){valid=parentData.type==='page';break;}
        if(parentData.type==='page'||typeof parentData.parentId!=='string'||
          !parentData.parentId||parentData.parentId.length>128)break;
        childId=ancestorId;
        ancestorId=parentData.parentId;
      }
      if(!valid)return err('not_found','Block ist nicht auf einer lesbaren Seite eingebettet.');
      if(ver!==Number(s.version))return err('conflict','Block wurde geändert. Bitte neu lesen.');
      const operation=required(args.operation,20);
      const allowedFields:Record<string,string[]>={
        set_text:['text'],set_checked:['checked'],set_note:['note'],set_due_date:['dueDate']
      };
      const fields=allowedFields[operation];
      if(!fields)return err('invalid_arguments','Unbekannte Blockänderung.');
      if(Object.keys(args).some(k=>!['workspaceId','blockId','expectedVersion','operation',...fields].includes(k)))
        return err('invalid_arguments','Diese Aktion darf keine anderen Blockfelder ändern.');
      const next={...data};
      if(operation==='set_text'){
        if(typeof args.text!=='string'||args.text.length>8000||
          (data.type==='todo'&&!args.text.trim()))
          return err('invalid_arguments','Blocktext ist ungültig (maximal 8.000 Zeichen).');
        next.text=args.text;
      }else if(operation==='set_checked'){
        if(data.type!=='todo'||typeof args.checked!=='boolean')
          return err('invalid_arguments','Nur Aufgaben lassen sich als erledigt markieren.');
        next.checked=args.checked;
      }else if(operation==='set_note'){
        if(data.type!=='todo'||typeof args.note!=='string'||args.note.length>2000)
          return err('invalid_arguments','Aufgabennotiz muss ein Text mit maximal 2.000 Zeichen sein.');
        next.notiz=args.note;
      }else if(operation==='set_due_date'){
        if(data.type!=='todo'||typeof args.dueDate!=='string'||args.dueDate.length>10)
          return err('invalid_arguments','Fälligkeitsdatum muss ein Text sein.');
        if(args.dueDate!==''&&(!/^\d{4}-\d{2}-\d{2}$/.test(args.dueDate)||
          !Number.isFinite(Date.parse(args.dueDate+'T00:00:00Z'))||
          new Date(args.dueDate+'T00:00:00Z').toISOString().slice(0,10)!==args.dueDate))
          return err('invalid_arguments','Fälligkeitsdatum muss ein gültiges JJJJ-MM-TT-Datum sein.');
        next.faellig=args.dueDate;
      }
      if(JSON.stringify(next)===JSON.stringify(data))
        return {workspaceId:w,documentId:pageId,blockId:id,version:ver,unchanged:true};
      const now=new Date().toISOString();
      const payload=JSON.stringify({...next,edited:now});
      if(payload.length>12000)return err('too_large','Block ist für die Cloud-Bearbeitung zu gross.');
      const changed=await db.prepare(
        "UPDATE saetze SET daten=?1,version=version+1,geaendert=?2,vonGeraet='Cloud-MCP' "+
        "WHERE bereich=?3 AND id=?4 AND seite=?5 AND tabelle='blocks' "+
        "AND version=?6 AND geloescht=0 AND verschluesselt=0 "+
        "AND json_valid(daten) AND json_extract(daten,'$.type')=?7 "+
        "AND COALESCE(json_extract(daten,'$.parentTable'),'')<>'collection' "+
        "AND json_extract(daten,'$.parentId')=?8 AND "+
        "EXISTS (SELECT 1 FROM saetze parent "+
        "JOIN json_each(CASE WHEN json_valid(parent.daten) AND "+
        "json_type(parent.daten,'$.content')='array' "+
        "THEN json_extract(parent.daten,'$.content') ELSE '[]' END) ref "+
        "ON ref.type='text' AND ref.value=?4 "+
        "WHERE parent.bereich=?3 AND parent.id=?8 AND parent.seite=?5 "+
        "AND parent.geloescht=0 AND parent.verschluesselt=0 AND parent.tabelle='blocks') "+
        "RETURNING version"
      ).bind(payload,now,w,id,pageId,ver,String(data.type),String(data.parentId))
        .first<{version:number}>();
      if(!changed)return err('conflict','Block wurde während der Bearbeitung geändert oder verschoben.');
      await notieren(ablage,{bereich:w,kontoId:userId,art:'mcp',
        text:'Block über Cloud-MCP bearbeitet',objekt:id});
      return {workspaceId:w,documentId:pageId,blockId:id,version:changed.version,unchanged:false};
    }
    if(name==='redion_update_schematic'){
      const id=required(args.blockId,128);
      const ver=expected(args.expectedVersion);
      const s=await ablage.hole('saetze',{bereich:w,id});
      if(!s||s.geloescht||s.tabelle!=='blocks')return err('not_found','Schaltplan nicht verfügbar.');
      const pageId=required(s.seite,128);
      // Page-level role check is done before returning any block metadata.
      await page(w,pageId,'bearbeiten');
      if(s.verschluesselt)return err('encrypted','Verschlüsselte Pläne können nicht in der Cloud bearbeitet werden.');
      let data:Record<string,unknown>;
      try{data=JSON.parse(String(s.daten||'')) as Record<string,unknown>;}
      catch{return err('invalid_data','Schaltplanblock ist nicht lesbar.');}
      if(!data||typeof data!=='object'||Array.isArray(data)||data.type!=='schaltplan'||
        data.parentTable==='collection'||data.alive===false||data.archiviert===true||
        !data.plan||typeof data.plan!=='object'||Array.isArray(data.plan))
        return err('not_found','Schaltplan nicht verfügbar.');
      const ancestors=await embedding(w,pageId,id,data);
      if(ver!==Number(s.version)||ver<1)return err('conflict','Schaltplan wurde geändert. Bitte erneut lesen.');
      const batch=args.changes!==undefined;
      if(batch&&(!Array.isArray(args.changes)||args.changes.length<1||args.changes.length>20||
        Object.keys(args).some(key=>!['workspaceId','blockId','expectedVersion','changes'].includes(key))))
        return err('invalid_arguments','Ein Batch muss 1–20 Änderungen enthalten und darf keine Einzelaktion enthalten.');
      let plan=data.plan;
      const elements:{elementId:string;elementType:string}[]=[];
      try{
        for(const [index,change] of (batch?args.changes as unknown[]:[args]).entries()){
          if(!change||typeof change!=='object'||Array.isArray(change))throw new Error(`Schritt ${index+1} ist kein Änderungsobjekt.`);
          if(batch&&Object.keys(change).some(key=>!Object.hasOwn(schematicEditFields,key)))
            throw new Error(`Schritt ${index+1} enthält unbekannte Felder.`);
          try{
            const edited=editSchematic(plan,change as Args);
            plan=edited.plan;
            elements.push({elementId:edited.elementId,elementType:edited.kind});
          }catch(error){
            if(!batch)throw error;
            throw new Error(`Schritt ${index+1}: ${error instanceof Error?error.message:'Ungültige Planänderung.'}`);
          }
        }
      }
      catch(error){return err('invalid_arguments',error instanceof Error?error.message:'Ungültige Planänderung.');}
      if(new TextEncoder().encode(JSON.stringify(plan)).byteLength>32000)
        return err('too_large','Schaltplan überschreitet die sichere Lesegrenze.');
      const timestamp=new Date().toISOString();
      const payload=JSON.stringify({...data,plan,edited:timestamp});
      if(new TextEncoder().encode(payload).byteLength>50000)return err('too_large','Schaltplanblock ist zu gross.');
      const updated=await db.prepare(
        "UPDATE saetze SET daten=?1,version=version+1,geaendert=?2,vonGeraet='Cloud-MCP' "+
        "WHERE bereich=?3 AND id=?4 AND tabelle='blocks' AND seite=?5 AND version=?6 "+
        "AND geloescht=0 AND verschluesselt=0 AND json_valid(daten) "+
        "AND json_extract(daten,'$.type')='schaltplan' "+
        "AND COALESCE(json_extract(daten,'$.parentTable'),'')<>'collection' "+
        unchangedEmbedding('?7')+
        "RETURNING version"
      ).bind(payload,timestamp,w,id,pageId,ver,JSON.stringify(ancestors)).first<{version:number}>();
      if(!updated)return err('conflict','Schaltplan wurde inzwischen bearbeitet. Bitte erneut lesen.');
      await notieren(ablage,{bereich:w,kontoId:userId,art:'mcp',
        text:'Schaltplan über Cloud-MCP ergänzt',objekt:id});
      return {workspaceId:w,documentId:pageId,blockId:id,version:updated.version,
        ...(batch?{elements}:elements[0]),
        electricalValidation:false,routingVerified:false};
    }
    if(name==='redion_create_learning_set'){
      const id=required(args.documentId,128),ver=expected(args.expectedVersion);
      const current=await page(w,id,'bearbeiten');
      const key=required(args.requestId,100);
      if(!/^[A-Za-z0-9_-]{8,100}$/.test(key))return err('invalid_arguments','Ungültige requestId.');
      let cards:ReturnType<typeof buildLearningSet>;
      try{cards=buildLearningSet(args);}catch(error){return err('invalid_arguments',error instanceof Error?error.message:'Ungültiges Set.');}
      const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
      const setId=await hash('cloud-mcp-learning-set\0'+principal.grantId+'\0'+w+'\0'+id+'\0'+key);
      const fingerprint=await hash(JSON.stringify({w,id,cards}));
      const cardIds=await Promise.all(cards.map(async(_,i)=>(await hash(setId+'\0'+i)).slice(0,32)));
      const now=new Date().toISOString();
      const rows=cards.map((card,i)=>({id:cardIds[i],type:'flashcard',text:card.content,content:[],parentId:id,parentTable:'block',alive:true,created:now,edited:now,herkunft:'ki',...card.meta,mcpRequestHash:fingerprint,mcpLearningSet:setId}));
      const list=current.data.content===undefined?[]:current.data.content;
      if(!Array.isArray(list)||list.some(k=>typeof k!=='string'||!k||k.length>128))
        return err('invalid_data','Ungültige Elternliste.');
      // A retry checks all original IDs and hashes, not just the first card.
      const retry=async()=>{
        const fresh=await page(w,id,'bearbeiten');
        if(!Array.isArray(fresh.data.content)||!cardIds.every(k=>(fresh.data.content as unknown[]).includes(k)))return null;
        const found=await Promise.all(cardIds.map(k=>ablage.hole('saetze',{bereich:w,id:k})));
        for(const row of found){
          if(!row||row.geloescht||row.verschluesselt||row.tabelle!=='blocks'||row.seite!==id)return null;
          let data:Record<string,unknown>;try{data=JSON.parse(String(row.daten));}catch{return null;}
          if(data.type!=='flashcard'||data.parentId!==id||data.alive===false||data.mcpRequestHash!==fingerprint||data.mcpLearningSet!==setId)return null;
        }
        return {workspaceId:w,documentId:id,cardIds,count:cards.length,parentVersion:Number(fresh.s.version),alreadyExists:true};
      };
      const previous=await retry();if(previous)return previous;
      if(Number(current.s.version)!==ver)return err('conflict','Seite wurde geändert. Bitte neu lesen.');
      if(list.length+cards.length>200)return err('too_large','Zu viele Blöcke auf dieser Seite.');
      const parent=JSON.stringify({...current.data,content:[...list,...cardIds],edited:now});
      if(new TextEncoder().encode(parent).byteLength>64000)return err('too_large','Elternseite zu gross.');
      if(!db.batch)return err('unavailable','D1-Transaktion nicht verfügbar.');
      const packed=JSON.stringify(rows),ids=JSON.stringify(cardIds);
      if(new TextEncoder().encode(packed).byteLength>80000)return err('too_large','Set zu gross.');
      // INSERT reads the complete candidate set. A single collision or stale
      // parent version prevents ALL rows. Plain INSERT rolls back on SQL error.
      const insert=db.prepare(
        "INSERT INTO saetze(id,bereich,tabelle,daten,verschluesselt,seite,version,geaendert,geloescht,vonGeraet) "+
        "SELECT json_extract(j.value,'$.id'),?2,'blocks',j.value,0,?3,1,?4,0,'Cloud-MCP' FROM json_each(?1) j "+
        "WHERE EXISTS (SELECT 1 FROM saetze p WHERE p.bereich=?2 AND p.id=?3 AND p.seite=?3 AND p.version=?5 "+
        "AND p.tabelle='blocks' AND p.verschluesselt=0 AND p.geloescht=0 AND p.daten=?6) "+
        "AND NOT EXISTS (SELECT 1 FROM saetze s JOIN json_each(?7) k ON s.id=k.value WHERE s.bereich=?2) "+
        "AND NOT EXISTS (SELECT 1 FROM json_each(?7) k JOIN json_each(?8) old ON old.value=k.value) RETURNING id"
      ).bind(packed,w,id,now,ver,String(current.s.daten),ids,JSON.stringify(list));
      const updateParent=db.prepare(
        "UPDATE saetze SET daten=?1,version=version+1,geaendert=?2,vonGeraet='Cloud-MCP' "+
        "WHERE bereich=?3 AND id=?4 AND version=?5 AND tabelle='blocks' AND verschluesselt=0 AND geloescht=0 AND daten=?6 "+
        "AND NOT EXISTS (SELECT 1 FROM json_each(?7) k WHERE NOT EXISTS (SELECT 1 FROM saetze s WHERE s.bereich=?3 AND s.id=k.value "+
        "AND s.seite=?4 AND s.tabelle='blocks' AND s.verschluesselt=0 AND s.geloescht=0 AND json_valid(s.daten) "+
        "AND json_extract(s.daten,'$.mcpRequestHash')=?8 AND json_extract(s.daten,'$.mcpLearningSet')=?9)) "+
        "RETURNING version"
      ).bind(parent,now,w,id,ver,String(current.s.daten),ids,fingerprint,setId);
      const outcome=await db.batch([insert,updateParent]);
      const count=outcome[0]?.results?.length||0,updated=outcome[1]?.results?.length||0;
      if(count===cards.length&&updated===1){
        await notieren(ablage,{bereich:w,kontoId:userId,art:'mcp',text:'Lernkartenset über Cloud-MCP erstellt',objekt:id});
        return {workspaceId:w,documentId:id,cardIds,count,parentVersion:ver+1,alreadyExists:false};
      }
      const same=await retry();if(same)return same;
      return err('conflict','Seitenversion oder requestId stimmt nicht mehr. Bitte neu lesen.');
    }
    if(name==='redion_add_block'||name==='redion_add_schematic'||name==='redion_create_learning_card'||['redion_create_mindmap','redion_create_whiteboard','redion_create_sheet'].includes(name)){
      const createSchematic=name==='redion_add_schematic';
      const createCard=name==='redion_create_learning_card';
      const visualType=name==='redion_create_mindmap'?'mindmap':name==='redion_create_whiteboard'?'whiteboard':name==='redion_create_sheet'?'blatt':'';
      const id=required(args.documentId,128);
      const ver=expected(args.expectedVersion);
      const current=await page(w,id,'bearbeiten');
      let learning:{content:string;meta:Record<string,unknown>}|undefined;
      if(createCard){try{learning=buildLearningCard(args);}catch(error){return err('invalid_arguments',error instanceof Error?error.message:'Ungültige Lernkarte.');}}
      const typ=visualType||(createCard?'flashcard':createSchematic?'schaltplan':required(args.typ,40));
      const allowedTypes=new Set(['text','h1','h2','h3','todo','bullet','number','quote','code','divider']);
      if(!visualType&&!createCard&&!createSchematic&&!allowedTypes.has(typ))
        return err('invalid_arguments','Diese Blockart erfordert eine eigene geprüfte Schreibfunktion.');
      if(args.inBlockId!==undefined)
        return err('invalid_arguments','Verschachtelte Blockerstellung ist noch nicht freigegeben.');
      const content=visualType?required(args.title,160):learning?learning.content:createSchematic?
        (args.titel===undefined?'Schaltplan':required(args.titel,120)):
        (args.text===undefined?'':text(args.text,12000));
      if(!createSchematic&&args.text!==undefined&&(typeof args.text!=='string'||args.text.length>12000))
        return err('invalid_arguments','Blocktext muss ein Text mit höchstens 12.000 Zeichen sein.');
      if(typ==='todo'&&!content.trim())return err('invalid_arguments','Eine Aufgabe benötigt einen Titel.');
      if(args.daten!==undefined&&(!args.daten||typeof args.daten!=='object'||Array.isArray(args.daten)))
        return err('invalid_arguments','Blockdaten müssen ein Objekt sein.');
      const input=args.daten as Record<string,unknown>|undefined;
      const meta:Record<string,unknown>=learning?learning.meta:{};
      if(visualType){
        const fields=visualType==='mindmap'?['nodes','connections','layout','camera']:visualType==='whiteboard'?['shapes']:['paper','pages','orientation','marks'];
        if(args.requestId===undefined||Object.keys(args).some(k=>!['workspaceId','documentId','expectedVersion','title','requestId',...fields].includes(k)))return err('invalid_arguments','Ungültige Zeichenfelder.');
        try{if(visualType==='mindmap')meta.karte=mindmap(args.nodes,args.connections,args.layout,args.camera);
          else if(visualType==='whiteboard'){meta.shapes=board(args.shapes);meta.raumVersion=1;meta.hoehe=520;}
          else {
            Object.assign(meta,sheet(args.paper,args.pages,args.orientation));
            if(args.marks!==undefined)meta.marken=appendSheetMarks(meta,args.marks);
          }
        }catch(error){return err('invalid_arguments',error instanceof Error?error.message:'Ungültige Zeichnung.');}
      }
      if(createSchematic){
        const art=required(args.art,40);
        if(!SCHEMATIC_ARTEN.includes(art))
          return err('invalid_arguments','Unbekannte Schaltplanart.');
        const quer=SCHEMATIC_QUER.has(art);
        meta.plan={art,breite:quer?1000:800,hoehe:quer?600:700,
          teile:[],leitungen:[],texte:[],
          ebenen:[
            {id:'plan',name:'Plan',farbe:'var(--text)',sichtbar:true},
            {id:'aufgabe',name:'Aufgabe',farbe:'#c2410c',sichtbar:true},
            {id:'loesung',name:'Lösung',farbe:'#15803d',sichtbar:true}
          ]};
      }
      if(input){
        if(typ!=='todo'||Object.keys(input).some(k=>!['faellig','notiz'].includes(k)))
          return err('invalid_arguments','Nur geprüfte Aufgabenfelder faellig und notiz sind erlaubt.');
        if(input.faellig!==undefined){
          if(typeof input.faellig!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(input.faellig)||
             !Number.isFinite(Date.parse(input.faellig+'T00:00:00Z'))||
             new Date(input.faellig+'T00:00:00Z').toISOString().slice(0,10)!==input.faellig)
            return err('invalid_arguments','faellig muss ein gültiges Datum JJJJ-MM-TT sein.');
          meta.faellig=input.faellig;
        }
        if(input.notiz!==undefined){
          if(typeof input.notiz!=='string'||input.notiz.length>2000)
            return err('invalid_arguments','Notiz darf maximal 2.000 Zeichen haben.');
          meta.notiz=input.notiz;
        }
      }
      // Keep stale expectedVersion for SQL's conditional INSERT. A genuine
      // retry must still find the existing block after page version advanced.
      if(current.data.content!==undefined&&(!Array.isArray(current.data.content)||
        current.data.content.some(k=>typeof k!=='string'||!k||k.length>128)))
        return err('invalid_data','Die Elternseite enthält eine ungültige Blockliste.');
      if(JSON.stringify(current.data).length>63000)
        return err('too_large','Die Elternseite hat nicht genug Platz für einen weiteren Block.');
      if(!db.batch)
        return err('unavailable','Die D1-Transaktion für Blockerstellung steht nicht zur Verfügung.');
      let requestId='';
      if(args.requestId!==undefined){
        requestId=required(args.requestId,100);
        if(requestId.length<8||!/^[A-Za-z0-9_-]+$/.test(requestId))
          return err('invalid_arguments','requestId muss aus 8–100 Buchstaben, Zahlen, _ oder - bestehen.');
      }
      const canonical=JSON.stringify({w,id,typ,content,meta});
      const hash=async(value:string)=>Array.from(new Uint8Array(
        await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),
        b=>b.toString(16).padStart(2,'0')).join('');
      const fingerprint=await hash(canonical);
      const key=requestId||'version-'+ver+'-'+fingerprint;
      const blockId=(await hash('cloud-mcp-block\0'+principal.grantId+'\0'+w+'\0'+id+'\0'+key)).slice(0,32);
      const now=new Date().toISOString();
      const data={id:blockId,type:typ,text:content,content:[],parentId:id,
        parentTable:'block',alive:true,created:now,edited:now,
        herkunft:'ki',...(typ==='todo'?{checked:false}:{}),...meta,
        mcpRequestHash:fingerprint};
      const payload=JSON.stringify(data);
      if(payload.length>28000)return err('too_large','Blockdaten sind zu gross.');
      // Both statements execute in one D1 transaction. The INSERT is
      // conditional on the same parent version and shape as the UPDATE;
      // neither can leave a detached child on stale-version conflicts.
      const insert=db.prepare(
        "INSERT OR IGNORE INTO saetze (id,bereich,tabelle,daten,verschluesselt,seite,version,geaendert,geloescht,vonGeraet) "+
        "SELECT ?1,?2,'blocks',?3,0,?4,1,?5,0,'Cloud-MCP' FROM saetze p "+
        "WHERE p.bereich=?2 AND p.id=?4 AND p.tabelle='blocks' AND p.version=?6 "+
        "AND p.verschluesselt=0 AND p.geloescht=0 AND p.seite=?4 "+
        "AND json_valid(p.daten) AND json_extract(p.daten,'$.type')='page' "+
        "AND (json_type(p.daten,'$.content') IS NULL OR json_type(p.daten,'$.content')='array') "+
        "AND COALESCE(json_array_length(p.daten,'$.content'),0)<200 "+
        "AND NOT EXISTS (SELECT 1 FROM json_each(CASE "+
        "WHEN json_type(p.daten,'$.content')='array' "+
        "THEN json_extract(p.daten,'$.content') ELSE '[]' END) WHERE value=?1) "+
        "RETURNING id"
      ).bind(blockId,w,payload,id,now,ver);
      const updateParent=db.prepare(
        "UPDATE saetze SET daten=json_set("+
        "CASE WHEN json_type(daten,'$.content')='array' "+
        "THEN json_insert(daten,'$.content[#]',?1) "+
        "ELSE json_set(daten,'$.content',json_array(?1)) END,"+
        "'$.edited',?2),version=version+1,geaendert=?2,vonGeraet='Cloud-MCP' "+
        "WHERE bereich=?3 AND id=?4 AND tabelle='blocks' AND version=?5 "+
        "AND verschluesselt=0 AND geloescht=0 AND json_valid(daten) "+
        "AND json_extract(daten,'$.type')='page' "+
        "AND (json_type(daten,'$.content') IS NULL OR json_type(daten,'$.content')='array') "+
        "AND COALESCE(json_array_length(daten,'$.content'),0)<200 "+
        "AND EXISTS (SELECT 1 FROM saetze child WHERE child.bereich=?3 AND child.id=?1 "+
        "AND child.tabelle='blocks' AND child.verschluesselt=0 AND child.geloescht=0 "+
        "AND json_valid(child.daten) AND json_extract(child.daten,'$.mcpRequestHash')=?6 "+
        "AND json_extract(child.daten,'$.parentId')=?4) "+
        "AND NOT EXISTS (SELECT 1 FROM json_each(CASE WHEN json_type(daten,'$.content')='array' "+
        "THEN json_extract(daten,'$.content') ELSE '[]' END) WHERE value=?1) "+
        "RETURNING version"
      ).bind(blockId,now,w,id,ver,fingerprint);
      const outcome=await db.batch([insert,updateParent]);
      const inserted=Array.isArray(outcome[0]?.results)&&outcome[0].results.length>0;
      const attached=Array.isArray(outcome[1]?.results)&&outcome[1].results.length>0;
      if(inserted&&attached){
        const version=(outcome[1]!.results![0] as {version:number}).version;
        await notieren(ablage,{bereich:w,kontoId:userId,art:'mcp',
          text:'Block über Cloud-MCP erstellt',objekt:blockId});
        return {workspaceId:w,documentId:id,blockId,version:1,
          parentVersion:version,alreadyExists:false};
      }
      if(inserted!==attached)
        return err('conflict','Die Blocktransaktion konnte nicht vollständig bestätigt werden.');
      const existing=await ablage.hole('saetze',{bereich:w,id:blockId});
      if(existing&&!existing.geloescht&&!existing.verschluesselt&&existing.tabelle==='blocks'){
        try{
          const stored=JSON.parse(String(existing.daten)) as Record<string,unknown>;
          const fresh=await page(w,id,'lesen');
          if(stored.mcpRequestHash===fingerprint&&stored.parentId===id&&
            Array.isArray(fresh.data.content)&&fresh.data.content.includes(blockId))
            return {workspaceId:w,documentId:id,blockId,
              version:Number(existing.version)||1,parentVersion:Number(fresh.s.version)||1,
              alreadyExists:true};
        }catch(error){if(!(error instanceof CloudMcpToolError))throw error;}
      }
      if(Array.isArray(current.data.content)&&current.data.content.length>=200)
        return err('too_large','Diese Seite hat zu viele Blöcke für einen Cloud-MCP-Aufruf.');
      return err('conflict','Seitenversion oder requestId stimmt nicht mehr. Bitte neu lesen.');
    }
    if(name==='redion_create_page'){
      const title=required(args.title,160);
      if(args.content!==undefined&&(typeof args.content!=='string'||args.content.length>12000))
        err('invalid_arguments','Seiteninhalt muss ein Text mit höchstens 12.000 Zeichen sein.');
      const content=typeof args.content==='string'?args.content:'';
      const parentId=args.parentId===undefined?'':text(args.parentId,128);
      if(args.parentId!==undefined&&!parentId)err('invalid_arguments','Ungültige Elternseite.');
      if(parentId)await page(w,parentId,'bearbeiten');else await role(w,'*','bearbeiten');
      const key=required(args.requestId,100);
      if(key.length<8||!/^[A-Za-z0-9_-]+$/.test(key))err('invalid_arguments','requestId ist ungültig.');
      const bytes=new TextEncoder().encode('cloud-mcp-page\0'+principal.grantId+'\0'+w+'\0'+key);
      const digest=await crypto.subtle.digest('SHA-256',bytes);
      const documentId=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('').slice(0,32);
      const data={type:'page',text:title,inhalt:content,parentId:parentId||null};
      const row=await db.prepare(
        'INSERT OR IGNORE INTO saetze (id,bereich,tabelle,daten,verschluesselt,seite,version,geaendert,geloescht,vonGeraet) '+
        "VALUES (?1,?2,'blocks',?3,0,?4,1,?5,0,'Cloud-MCP') RETURNING version"
      ).bind(documentId,w,JSON.stringify(data),documentId,new Date().toISOString()).first<{version:number}>();
      if(!row){
        const existing=await page(w,documentId,'lesen');
        if(existing.data.text!==title||existing.data.inhalt!==content||existing.data.parentId!==(parentId||null))
          err('conflict','requestId wurde bereits für eine andere Seite verwendet.');
        return {documentId,version:Number(existing.s.version)||1,alreadyExists:true};
      }
      await notieren(ablage,{bereich:w,kontoId:userId,art:'mcp',text:'Neue Seite über Cloud-MCP',objekt:documentId});
      return {documentId,version:1,alreadyExists:false};
    }
    const id=required(args.documentId,128);
    const current=await page(w,id,'bearbeiten');
    const ver=expected(args.expectedVersion);
    if(ver!==Number(current.s.version||1))err('conflict','Seite wurde zwischenzeitlich geändert. Bitte erneut lesen.');
    if(name==='redion_append_content'){
      if(typeof args.content!=='string'||args.content.length>4000||!args.content.trim())
        return err('invalid_arguments','Anhang muss einen nichtleeren Text mit höchstens 4.000 Zeichen enthalten.');
      const addition=args.content;
      const old=current.data.inhalt;
      if(typeof old!=='string')return err('not_found','Seite hat keinen Textinhalt.');
      const next=old?old+'\n'+addition:addition;
      if(next.length>12000)return err('invalid_arguments','Seiteninhalt ist zu gross.');
      return update(w,id,ver,{...current.data,inhalt:next});
    }
    if(name==='redion_move_page'){
      const target=args.newParentId===undefined?'':text(args.newParentId,128);
      if(args.newParentId!==undefined&&typeof args.newParentId!=='string')
        return err('invalid_arguments','Ungültige Elternseite.');
      if(target===id)return err('invalid_arguments','Eine Seite kann nicht ihr eigener Elternknoten sein.');
      if(target){
        await page(w,target,'bearbeiten');
        const visited=new Set<string>([id]);
        let cursor=target;
        for(let depth=0;cursor&&depth<40;depth++){
          if(visited.has(cursor))return err('invalid_arguments','Zyklische Seitenhierarchie ist nicht erlaubt.');
          visited.add(cursor);
          const ancestor=await page(w,cursor,'lesen');
          cursor=typeof ancestor.data.parentId==='string'?ancestor.data.parentId:'';
          if(!cursor)break;
          if(depth===39)return err('invalid_arguments','Seitenhierarchie ist zu tief.');
        }
      }else await role(w,'*','bearbeiten');
      return update(w,id,ver,{...current.data,parentId:target||null},target||undefined);
    }
    if(name==='redion_update_page'){
      if(Object.keys(args).some(key=>!['workspaceId','documentId','expectedVersion','title','archived'].includes(key)))
        return err('invalid_arguments','Unbekannte Seitenänderung.');
      if(args.archived===undefined)return update(w,id,ver,{...current.data,text:required(args.title,160)});
      const archive=archiveFlag(args.archived)===1;
      if(current.data.alive===false||current.data.parentTable==='collection'||current.data.system||
          (current.s.seite&&current.s.seite!==id))return err('not_found','Archivfähige Seite nicht verfügbar.');
      const next={...current.data};
      if(args.title!==undefined)next.text=required(args.title,160);
      if(archive!==(current.data.archiviert===true)){
        next.archiviert=archive;
        next.archiviertAm=archive?new Date().toISOString():'';
      }
      if(JSON.stringify(next)===JSON.stringify(current.data))return {documentId:id,version:ver,archived:archive,unchanged:true};
      next.edited=new Date().toISOString();
      return {...await update(w,id,ver,next),archived:archive,unchanged:false};
    }
    if(name==='redion_replace_text'){
      if(typeof args.find!=='string'||!args.find.length||args.find.length>2000)
        return err('invalid_arguments','Suchtext muss 1 bis 2.000 Zeichen enthalten.');
      const find=args.find,replacement=text(args.replacement,4000);
      if(typeof args.replacement!=='string'||args.replacement.length>4000)err('invalid_arguments','Ungültiger Ersatztext.');
      const old=current.data.inhalt;
      if(typeof old!=='string')return err('not_found','Seite hat keinen Textinhalt.');
      if(!old.includes(find))return err('not_found','Text nicht im Seiteninhalt gefunden.');
      return update(w,id,ver,{...current.data,inhalt:old.replaceAll(find,replacement)});
    }
    return err('not_found','Unbekanntes Werkzeug.');
  };
};
