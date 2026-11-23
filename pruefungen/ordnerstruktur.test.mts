import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pruefeStruktur,erstelleBaum,schreibeBericht,QUELLORDNER,LOKALE_BAUAUSGABEN} from '../skripte/ordnerstruktur.mts';

const repo=resolve(import.meta.dirname,'..');

test('RED ION: Quellstruktur und gezielt ignorierte Build-Ausgaben',()=>{
  assert.deepEqual(pruefeStruktur(repo),[]);
  assert.ok(QUELLORDNER.includes('src/bereiche'));
  assert.ok(LOKALE_BAUAUSGABEN.includes('build/windows-visual-mcp-dist'));
});

test('RED ION: Ordnerbaum zeigt Quellen und Ausgaben getrennt und ohne Geheimnisse',()=>{
  const basis=mkdtempSync(join(tmpdir(),'redion-ordnerbaum-'));
  try{
    mkdirSync(join(basis,'src/bereiche/editor'),{recursive:true});
    mkdirSync(join(basis,'build/visual-web-emission'),{recursive:true});
    mkdirSync(join(basis,'node_modules/verboten'),{recursive:true});
    writeFileSync(join(basis,'src/bereiche/editor','editor.ts'),'export {};\n');
    writeFileSync(join(basis,'.env.local'),'test-geheimnis');
    writeFileSync(join(basis,'build/visual-web-emission','test.js'),'console.log("Beispiel");');
    writeFileSync(join(basis,'node_modules/verboten','nichtzeigen.js'),''); 
    // A link to an unrelated directory must never be followed, even in a
    // developer checkout. Some Windows accounts cannot create symlinks.
    try{symlinkSync(join(basis,'node_modules'),join(basis,'src','fremd-link'),'dir');}
    catch{/* Keine Symlink-Rechte: die übrigen Schutzregeln bleiben prüfbar. */}
    const baum=erstelleBaum(basis,5);
    assert.match(baum,/src\//);
    assert.match(baum,/editor\.ts/);
    assert.match(baum,/visual-web-emission\//);
    assert.match(baum,/test\.js/);
    assert.doesNotMatch(baum,/\.env\.local|test-geheimnis|verboten|nichtzeigen|fremd-link/);
    assert.match(baum,/quell\/ \(noch nicht erzeugt\)/);
  }finally{rmSync(basis,{recursive:true,force:true});}
});

test('RED ION: maximal zulässige Baumtiefe wird geprüft',()=>{
  assert.throws(()=>erstelleBaum(repo,0),/Tiefe/);
  assert.throws(()=>erstelleBaum(repo,13),/Tiefe/);
});


test('RED ION: Bericht erzeugt nur eine lokale, wiederholbare Textübersicht',()=>{
  const basis=mkdtempSync(join(tmpdir(),'redion-struktur-bericht-'));
  try{
    for(const teil of QUELLORDNER)mkdirSync(join(basis,teil),{recursive:true});
    writeFileSync(join(basis,'.gitignore'),
      LOKALE_BAUAUSGABEN.map(p=>'/'+p+'/').join('\n')+'\n');
    writeFileSync(join(basis,'src/bereiche','demo.ts'),'const redion=1;\n');
    assert.deepEqual(pruefeStruktur(basis),[]);
    const bericht=schreibeBericht(basis,4);
    assert.equal(bericht,join(basis,'build/struktur/PROJEKTBAUM.txt'));
    const first=readFileSync(bericht,'utf8');
    assert.match(first,/src\/ = TypeScript-Quelle/);
    assert.match(first,/demo\.ts/);
    assert.match(first,/build\//);
    assert.equal(readFileSync(schreibeBericht(basis,4),'utf8'),first,
      'Das eigene Ausgabeprotokoll darf den Ordnerbaum nicht verändern.');
  }finally{rmSync(basis,{recursive:true,force:true});}
});
