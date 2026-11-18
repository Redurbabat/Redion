/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/datenbanken/automatisierung.ts (npm run bauen:ts). */
/** Bestehende Sammlungen und Spaltenrechte; kein paralleles Tabellenmodell. */
(() => {
  const R=RegisterAutomatisierung;
  const collection=(id:string,c:AutomationContext,write=false):any=>{
    const coll=Store.getCollection(id);
    if(!coll||Konten.darfAnSammlung(write?'bearbeiten':'lesen',id)!==true)c.error('PERMISSION_DENIED');
    const block=Object.values<any>(Store.cache.blocks).find(b=>b.alive&&b.type==='database'&&b.collectionId===id);
    if(!block)c.error('INVALID_DATABASE');c.block(block.id,write);return {coll,page:c.pageOf(block.id)};
  };
  const properties=(coll:any,values:Record<string,unknown>,c:AutomationContext):Record<string,unknown>=>{
    if(Object.keys(values).length>25)c.error('ACTION_TOO_LARGE');
    for(const [key,value] of Object.entries(values)) {
      const def=coll.schema[key];if(!def)c.error('INVALID_PROPERTY');
      if(!Feldrechte.darfSchreiben(coll.id,key))c.error('PERMISSION_DENIED');
      const kind=String(def.type);
      if(!['title','text','number','checkbox','date','select','multi-select','url','email','phone'].includes(kind))c.error('UNSUPPORTED_PROPERTY_TYPE');
      if(kind==='number'&&value!==null&&(typeof value!=='number'||!Number.isFinite(value)))c.error('INVALID_PROPERTY_VALUE');
      if(kind==='checkbox'&&typeof value!=='boolean')c.error('INVALID_PROPERTY_VALUE');
      if(!['number','checkbox','multi-select'].includes(kind)&&value!==null&&typeof value!=='string')c.error('INVALID_PROPERTY_VALUE');
      if(kind==='multi-select'&&(!Array.isArray(value)||value.length>30||value.some(v=>typeof v!=='string')))c.error('INVALID_PROPERTY_VALUE');
      if(typeof value==='string'&&value.length>12000)c.error('INVALID_PROPERTY_VALUE');
      if((kind==='select'||kind==='multi-select')&&value) {
        const options=new Set((def.options||[]).map((x:any)=>typeof x==='string'?x:x.name));
        const list=Array.isArray(value)?value:[value];if(list.some(v=>!options.has(v)))c.error('INVALID_PROPERTY_VALUE');
      }
      if(!Pruefen.feld(def,value).ok)c.error('INVALID_PROPERTY_VALUE');
    }
    return values;
  };
  R.melde('redion_create_database',async(a,c)=>{
    const p=c.block(a.documentId,true);if(p.type!=='page')c.error('INVALID_DOCUMENT');await c.prepare(p.id);
    const result=Store.addDatabase(p.id,a.name);await c.finish(p.id);return {databaseId:result.collectionId,blockId:result.block.id,viewId:result.viewId};
  });
  R.melde('redion_list_database_rows',(a,c)=>{
    const {coll}=collection(a.databaseId,c);
    const keys=Object.keys(coll.schema).filter(k=>Feldrechte.darfSehen(coll.id,k));
    return {databaseId:coll.id,schema:Object.fromEntries(keys.map(k=>[k,coll.schema[k]])),
      rows:Store.rowsOf(coll.id).filter((r:any)=>Konten.darf('lesen',r.id)).slice(0,a.limit||50).map((r:any)=>({id:r.id,properties:Object.fromEntries(keys.map(k=>[k,r.props?.[k]??null]))}))};
  });
  R.melde('redion_add_database_row',async(a,c)=>{
    const {coll,page}=collection(a.databaseId,c,true);properties(coll,a.properties,c);await c.prepare(page.id);
    collection(coll.id,c,true);properties(coll,a.properties,c);const row=Store.addRow(coll.id,a.properties);
    await c.finish(page.id);return {rowId:row.id,databaseId:coll.id};
  });
  R.melde('redion_update_database_row',async(a,c)=>{
    const row=c.block(a.rowId,true);if(row.parentTable!=='collection')c.error('INVALID_DATABASE_ROW');
    const {coll,page}=collection(row.parentId,c,true);properties(coll,a.properties,c);await c.prepare(page.id);
    c.block(row.id,true);properties(coll,a.properties,c);for(const [k,v] of Object.entries(a.properties))Store.setProp(row.id,k,v);
    await c.finish(page.id);return {rowId:row.id,databaseId:coll.id};
  });
})();
