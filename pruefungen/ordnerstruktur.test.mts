import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pruefeStruktur,erstelleBaum,QUELLORDNER,LOKALE_BAUAUSGABEN} from '../skripte/ordnerstruktur.mts';

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
