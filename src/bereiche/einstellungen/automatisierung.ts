/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/einstellungen/automatisierung.ts (npm run bauen:ts). */
/** Die Freigabeliste schliesst Konto-, API-, Sync- und Sicherheitsoptionen aus. */
(() => {
  const choices:Record<string,unknown[]>={theme:['dark','light'],bewegung:['normal','ruhig'],kontrast:[false,true],dichte:['normal','kompakt']};
  RegisterAutomatisierung.melde('redion_get_settings',()=>({settings:Object.fromEntries(Object.keys(choices).map(k=>[k,Store.getMeta(k,k==='kontrast'?false:k==='theme'?'dark':'normal')]))}));
  RegisterAutomatisierung.melde('redion_update_setting',async(a,c)=>{
    if(!choices[a.key]?.includes(a.value))c.error('INVALID_SETTING');
    if(!Konten.darf('bearbeiten'))c.error('PERMISSION_DENIED');c.check();
    if(a.key==='theme')Aussehen.grundWechseln(a.value);
    else Einstellungen.S(a.key,a.value);
    await c.finish();return {key:a.key,value:Store.getMeta(a.key)};
  });
})();
