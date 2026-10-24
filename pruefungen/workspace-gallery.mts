/* Lokale Galerie tatsächlicher Prüfbilder, keine Konzepte und kein Netz. */
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../bilder/workspace-2');
const sizes=[[390,844],[430,932],[1366,768],[1440,900]] as const;
const states=['pdf-filter','filter-leer','favoriten','favoriten-leer','suche','menue','liste','ordner-leer'];
const exists=(file:string)=>fs.existsSync(path.join(root,file));
const picture=(file:string,title:string,width:number,height:number)=>exists(file)
  ? `<figure><a href="${file}" target="_blank" rel="noopener"><img src="${file}" alt="${title}" width="${width}" height="${height}" loading="lazy"></a><figcaption>${title}</figcaption></figure>`
  : `<p>${title}: Bild noch nicht vorhanden.</p>`;
const sections:string[]=[];
for(const [width,height] of sizes) for(const theme of ['hell','dunkel']) {
  const name=`${width}-${theme}`;
  const before=exists(`chromium/vorher/${name}.png`)?`chromium/vorher/${name}.png`:`vorher/${name}.png`;
  sections.push(`<section><h2>${width} × ${height} · ${theme}</h2><div class="pair">`+
    picture(before,'Vorher · unveränderter Basisstand',width,height)+
    picture(`chromium/nachher/${name}.png`,'Nachher · Workspace-Bibliothek',width,height)+'</div>');
  for(const engine of ['chromium','webkit']) {
    sections.push(`<details><summary>${engine} · Filter, Favoriten, Suche, Menü, Liste und leerer Ordner</summary><div class="states">`+
      states.map(state=>picture(`${engine}/pruefung/${name}-${state}.png`,state,width,height)).join('')+'</div></details>');
  }
  sections.push('</section>');
}
const html=`<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' file:; style-src 'unsafe-inline'">
<title>Redion Workspace 2 · echte Prüfbilder</title><style>
*{box-sizing:border-box}body{font:15px/1.6 system-ui,sans-serif;background:#151619;color:#f1f2f4;margin:0;padding:32px;max-width:1600px;margin-inline:auto}
h1{font-size:30px;line-height:1.2}h2{margin-top:36px}p{color:#c1c3c8}section{border-top:1px solid #44464c;margin-top:32px}.pair,.states{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}figure{margin:0;min-width:0}img{width:100%;height:auto;display:block;border:1px solid #555860;border-radius:10px}figcaption{padding:8px 0;color:#d1d3d8}details{margin:20px 0}summary{cursor:pointer;padding:12px;border:1px solid #555860;border-radius:10px}.states{margin-top:16px}@media(max-width:700px){body{padding:16px}.pair,.states{grid-template-columns:1fr}}
</style><h1>Redion Workspace 2</h1><p>Echte Screenshots der laufenden Anwendung mit ausschliesslich synthetischen Prüfdaten. Die Vergleiche zeigen dieselben Dokumente, keine Konzeptbilder. Bilder anklicken für Originalgrösse. WebKit auf Windows ersetzt keine native iPhone-Abnahme.</p>${sections.join('\n')}</html>`;
fs.mkdirSync(root,{recursive:true}); fs.writeFileSync(path.join(root,'galerie.html'),html);
console.log('Galerie: bilder/workspace-2/galerie.html');
