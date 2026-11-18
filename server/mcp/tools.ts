import {openCloudRepository,cloudError,type CloudDatabase,type CloudRecord} from './repository.ts';
import type {McpPrincipal} from './oauth.ts';

export const CLOUD_TOOL_NAMES=['redion_get_status','redion_get_capabilities','redion_list_workspaces','redion_list_documents','redion_search',
  'redion_read_page','redion_create_page','redion_update_page','redion_insert_block','redion_update_block','redion_replace_text','redion_create_task','redion_update_task'] as const;
const kinds=new Set(['text','h1','h2','h3','bullet','number','todo','quote','callout','divider','code']);
type Input=Record<string,unknown>;
const summary=(row:CloudRecord,data:Input)=>({id:row.id,workspaceId:row.bereich,title:String(data.text??''),type:data.type,
  parentId:data.parentId??null,version:row.version,syncedAt:row.geaendert,originDevice:row.vonGeraet});
const blockSummary=(row:CloudRecord,data:Input)=>({id:row.id,type:data.type,text:String(data.text??''),version:row.version,...(data.type==='todo'?{checked:!!data.checked}:{})});
const object=(value:unknown):Input=>{if(!value||typeof value!=='object'||Array.isArray(value))return cloudError('INVALID_INPUT');return value as Input;};
const string=(value:unknown,max=12000):string=>{if(typeof value!=='string'||value.length>max)return cloudError('INVALID_INPUT');return value;};

export const createCloudTools=(database:CloudDatabase,now:()=>number=Date.now)=>({
  names:CLOUD_TOOL_NAMES,
  async call(principal:McpPrincipal,name:string,args:Input):Promise<Input>{
    if(!CLOUD_TOOL_NAMES.some(n=>n===name))return cloudError('UNKNOWN_TOOL');
    const repository=await openCloudRepository(database,principal,now);
    const workspaceId=args.workspaceId===undefined?undefined:string(args.workspaceId,80);
    const readLimit=Number(args.limit??100);if(!Number.isInteger(readLimit)||readLimit<1||readLimit>100)return cloudError('INVALID_INPUT');
    const body=(data:Input)=>({source:'cloud',windowAvailable:false,...data});
    const page=async(id:unknown,write=false)=>{
      const record=await repository.record(string(id,80),workspaceId,write);if(record.data.type!=='page')return cloudError('INVALID_DOCUMENT');
      return record;
    };
    const updated=(row:CloudRecord,patch:Input):CloudRecord=>({...row,daten:JSON.stringify({...repository.rowData(row),...patch,edited:repository.changedAt(),herkunft:'ki'}),
      version:row.version+1,geaendert:repository.changedAt(),vonGeraet:'MCP'});
    const newRow=async(id:string,workspace:string,pageId:string,data:Input):Promise<CloudRecord>=>{
      await repository.reserve(workspace,id);const when=repository.changedAt();
      return {id,bereich:workspace,tabelle:'blocks',daten:JSON.stringify({id,alive:true,created:when,edited:when,herkunft:'ki',...data}),
        verschluesselt:0,seite:pageId,version:1,geaendert:when,geloescht:0,vonGeraet:'MCP'};
    };
    const newBlock=async(workspace:string,pageId:string,parentId:string,value:unknown):Promise<CloudRecord>=>{
      const input=object(value),type=string(input.type,50);if(!kinds.has(type))return cloudError('UNSUPPORTED_BLOCK_TYPE');
      const text=string(input.text);return newRow(crypto.randomUUID(),workspace,pageId,{type,text,content:[],parentId,parentTable:'blocks',
        ...(type==='todo'?{checked:!!input.checked}:{})});
    };
    if(name==='redion_get_status')return body({connected:true,storage:'existing-redion-sync',desktopConnected:false});
    if(name==='redion_get_capabilities')return body({tools:[...CLOUD_TOOL_NAMES],scopes:[...principal.scopes],
      documents:'synchronized-and-readable',requiresRunningDevice:['window-capture','native-window-navigation'],encryptedPrivateDataReadable:false});
    if(name==='redion_list_workspaces')return body({workspaces:await repository.workspaces()});
    if(name==='redion_list_documents')return body({documents:(await repository.pages(readLimit,workspaceId)).map(p=>summary(p.row,p.data))});
    if(name==='redion_search'){
      const offset=Number(args.offset??0);if(!Number.isSafeInteger(offset)||offset<0||offset>1000000)return cloudError('INVALID_INPUT');
      const result=await repository.search(string(args.query,200),readLimit,offset,workspaceId);
      return body({documents:result.documents.map(p=>summary(p.row,p.data)),nextOffset:result.nextOffset});
    }
    if(name==='redion_read_page'){
      const p=await page(args.documentId),children=await repository.children(p.row,p.data,readLimit);
      return body({document:summary(p.row,p.data),blocks:children.map(child=>blockSummary(child.row,child.data)),
        limitedToDirectBlocks:readLimit});
    }
    if(!principal.scopes.includes('redion:write'))return cloudError('PERMISSION_DENIED');
    if(name==='redion_create_page'){
      if(args.open===true)return cloudError('DEVICE_REQUIRED');
      const workspace=workspaceId??(principal.workspaceIds.length===1?principal.workspaceIds[0]!:cloudError('AMBIGUOUS_WORKSPACE'));
      const title=string(args.title,300);if(!title.trim())return cloudError('INVALID_INPUT');
      const parent=args.parentId===undefined?null:await page(args.parentId,true);
      if(parent&&parent.row.bereich!==workspace)return cloudError('PERMISSION_DENIED');
      const id=crypto.randomUUID(),children:CloudRecord[]=[];
      if(args.blocks!==undefined&&!Array.isArray(args.blocks))return cloudError('INVALID_INPUT');
      const entries=(args.blocks??[]) as unknown[];if(entries.length>25)return cloudError('ACTION_TOO_LARGE');
      for(const block of entries)children.push(await newBlock(workspace,id,id,block));
      const created=await newRow(id,workspace,id,{type:'page',text:title,parentId:parent?.row.id??null,parentTable:'blocks',
        content:children.map(child=>child.id),icon:'📄',aliases:[],cover:'',wide:false,font:'default',small:false});
      const changes=[created,...children];
      if(parent)changes.push(updated(parent.row,{content:[...(Array.isArray(parent.data.content)?parent.data.content:[]),id]}));
      await repository.commit(changes,name);
      return body({document:summary(created,repository.rowData(created)),blocks:children.map(c=>blockSummary(c,repository.rowData(c))),opened:false});
    }
    if(name==='redion_update_page'){
      const p=await page(args.documentId,true),change=updated(p.row,{text:string(args.title,300)});
      await repository.commit([change],name);return body({document:summary(change,repository.rowData(change))});
    }
    if(name==='redion_insert_block'||name==='redion_create_task'){
      const p=await page(args.documentId,true),created=await newBlock(p.row.bereich,p.row.id,p.row.id,
        name==='redion_create_task'?{type:'todo',text:args.text,checked:false}:args.block);
      const ids=Array.isArray(p.data.content)?[...p.data.content]:[];
      const index=args.index===undefined?ids.length:Number(args.index);if(!Number.isInteger(index)||index<0||index>ids.length)return cloudError('INVALID_INPUT');
      ids.splice(index,0,created.id);await repository.commit([updated(p.row,{content:ids}),created],name);
      return body({documentId:p.row.id,block:blockSummary(created,repository.rowData(created))});
    }
    if(name==='redion_update_block'||name==='redion_update_task'){
      const b=await repository.record(string(args.blockId,80),workspaceId,true);
      if(!kinds.has(String(b.data.type))||name==='redion_update_task'&&b.data.type!=='todo')return cloudError('UNSUPPORTED_BLOCK_TYPE');
      if(name==='redion_update_block'&&String(b.data.text??'')!==args.expectedText)return cloudError('STALE_DOCUMENT');
      const patch:Input=name==='redion_update_task'?{checked:!!args.checked}:{text:string(args.text),
        ...(args.checked!==undefined&&b.data.type==='todo'?{checked:!!args.checked}:{})};
      await repository.commit([updated(b.row,patch)],name);return body({documentId:b.row.seite,blockId:b.row.id});
    }
    if(name==='redion_replace_text'){
      const p=await page(args.documentId,true),children=await repository.children(p.row,p.data,100);
      if(Array.isArray(p.data.content)&&p.data.content.length>100)return cloudError('ACTION_TOO_LARGE');
      const find=string(args.find),replacement=string(args.replacement);if(!find)return cloudError('INVALID_INPUT');
      let hit:{row:CloudRecord;text:string}|undefined;
      for(const child of children){
        if(!kinds.has(String(child.data.type)))continue;const text=String(child.data.text??''),index=text.indexOf(find);if(index<0)continue;
        if(hit||text.indexOf(find,index+find.length)>=0)return cloudError('AMBIGUOUS_TEXT');hit={row:child.row,text};
      }
      if(!hit)return cloudError('TEXT_NOT_FOUND');await repository.authorize(hit.row,true);
      await repository.commit([updated(hit.row,{text:hit.text.replace(find,()=>replacement)})],name);
      return body({blockId:hit.row.id,replacements:1});
    }
    return cloudError('UNKNOWN_TOOL');
  }
});
export type CloudTools=ReturnType<typeof createCloudTools>;
