/**
 * RED ION: Quellordner erhalten, lokale Bauausgaben dokumentieren.
 *
 * node skripte/ordnerstruktur.mts --pruefen
 * node skripte/ordnerstruktur.mts --bericht [--tiefe 6]
 * node skripte/ordnerstruktur.mts --baum [--tiefe 4]
 *
 * Keine Nutzerdateien lesen, keine Build-Inhalte veraendern, keine Symlinks
 * verfolgen. Nur --bericht legt build/struktur/PROJEKTBAUM.txt neu an.
 */
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const QUELLORDNER = [
  'src/bereiche', 'src/core', 'src/kern', 'src/register', 'src/schale',
  'src/islands', 'server/mcp', 'plugins/red-ion', 'windows', 'ios',
  'pruefungen', 'doku', 'skripte', 'quell'
] as const;

export const LOKALE_BAUAUSGABEN = [
  'build/visual-web-emission', 'build/visual-web-merged',
  'build/windows-visual-mcp-dist', 'build/struktur'
] as const;

const ANSICHTSORDNER = [
  'src', 'quell', 'server', 'plugins', 'windows', 'ios', 'pruefungen',
  'skripte', 'tools', 'doku', 'build'
] as const;

const VERBOTENE_ORDNER = new Set([
  '.git', 'node_modules', '.wrangler', '__pycache__', '.venv',
  'coverage', '.next'
]);

const vertraulich = (name: string): boolean =>
  VERBOTENE_ORDNER.has(name) ||
  /^\.env(?:\.|$)/i.test(name) ||
  /^\.dev\.vars(?:\.|$)/i.test(name) ||
  /^redion-sicherung-/i.test(name) ||
  /\.(?:redion|pem|key|p12|pfx|mobileprovision|log)$/i.test(name) ||
  /^id_(?:rsa|ed25519)(?:\.pub)?$/i.test(name);

const istOrdner = (pfad: string): boolean => {
  try {
    const s = lstatSync(pfad);
    return s.isDirectory() && !s.isSymbolicLink();
  } catch { return false; }
};

export function pruefeStruktur(wurzel: string = WURZEL): string[] {
  const fehler: string[] = [];
  for (const teil of QUELLORDNER) {
    if (!istOrdner(join(wurzel, teil)))
      fehler.push('Quellordner fehlt oder ist ein Symlink: ' + teil);
  }
  const ignoreDatei = join(wurzel, '.gitignore');
  if (!existsSync(ignoreDatei)) {
    fehler.push('.gitignore fehlt');
  } else {
    const ignore = new Set(readFileSync(ignoreDatei, 'utf8')
      .split(/\r?\n/).map(s => s.trim()));
    for (const ausgabe of LOKALE_BAUAUSGABEN)
      if (!ignore.has('/' + ausgabe + '/'))
        fehler.push('Lokale Bauausgabe nicht ignoriert: ' + ausgabe);
  }
  return fehler;
}

export function erstelleBaum(wurzel: string = WURZEL, tiefe = 5): string {
  if (!Number.isSafeInteger(tiefe) || tiefe < 1 || tiefe > 12)
    throw new Error('Tiefe muss zwischen 1 und 12 liegen.');
  const zeilen: string[] = ['Redion/'];
  let gesehene = 0;
  const maksimum = 30000;
  const unterordner = (ort: string, prefix: string, ebene: number): void => {
    if (ebene >= tiefe || gesehene >= maksimum) return;
    const eintraege = readdirSync(ort, {withFileTypes:true})
      .filter(e => !vertraulich(e.name) && !e.isSymbolicLink() &&
        (e.isDirectory() || e.isFile()))
      .sort((a,b) => a.isDirectory() === b.isDirectory()
        ? (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
        : a.isDirectory() ? -1 : 1);
    for (let i=0;i<eintraege.length;i++) {
      if (++gesehene > maksimum) {
        zeilen.push(prefix + '└── … (Sicherheitsgrenze der Übersicht)');
        return;
      }
      const eintrag = eintraege[i]!;
      const letzter = i === eintraege.length-1;
      const absolut = join(ort,eintrag.name);
      zeilen.push(prefix + (letzter?'└── ':'├── ') +
        eintrag.name + (eintrag.isDirectory()?'/':''));
      if (eintrag.isDirectory())
        unterordner(absolut,prefix + (letzter?'    ':'│   '),ebene+1);
    }
  };
  for(let i=0;i<ANSICHTSORDNER.length;i++){
    const name=ANSICHTSORDNER[i]!;
    const letzter=i===ANSICHTSORDNER.length-1;
    const ziel=join(wurzel,name);
    const stem=letzter?'└── ':'├── ';
    if(!istOrdner(ziel)){
      zeilen.push(stem+name+'/ (noch nicht erzeugt)');
      continue;
    }
    zeilen.push(stem+name+'/');
    unterordner(ziel,letzter?'    ':'│   ',1);
  }
  return zeilen.join('\n')+'\n';
}

const bauordnerPruefen = (wurzel: string): void => {
  for(const teil of ['build','build/struktur']){
    const abs=join(wurzel,teil);
    if(existsSync(abs)&&!istOrdner(abs))
      throw new Error('Unsicheres Bauziel (Datei oder Symlink): '+teil);
  }
};

export function schreibeBericht(wurzel: string = WURZEL, tiefe = 6): string {
  const fehler=pruefeStruktur(wurzel);
  if(fehler.length)throw new Error(fehler.join('\n'));
  bauordnerPruefen(wurzel);
  const ziel=join(wurzel,'build/struktur');
  mkdirSync(ziel,{recursive:true});
  const datei=join(ziel,'PROJEKTBAUM.txt');
  const text='RED ION – Projektstruktur (lokal erzeugt)\n' +
    'Quelle: echte Ordnernamen; keine privaten Dateien oder Symlinks.\n' +
    'src/ = TypeScript-Quelle; quell/ = erzeugtes, versioniertes JavaScript.\n' +
    'build/ = lokale Bauausgabe, nicht nach GitHub pushen.\n\n' +
    erstelleBaum(wurzel,tiefe);
  writeFileSync(datei,text,'utf8');
  return datei;
}

function main(): void {
  const args=process.argv.slice(2);
  const pos=args.indexOf('--tiefe');
  let tiefe=6;
  if(pos>=0){
    if(pos+1>=args.length||!/^\d+$/.test(args[pos+1]!))
      throw new Error('Nach --tiefe eine ganze Zahl von 1 bis 12 angeben.');
    tiefe=Number(args[pos+1]);
  }
  if(args.includes('--pruefen')){
    const fehler=pruefeStruktur();
    if(fehler.length)throw new Error(fehler.join('\n'));
    console.log('RED ION: Quellordner und Bauausgabe-Grenzen stimmen.');
  }else if(args.includes('--bericht')){
    const datei=schreibeBericht(WURZEL,tiefe);
    console.log('RED ION: Ordnerbaum erzeugt: '+datei);
  }else if(args.includes('--baum')||args.length===0){
    process.stdout.write(erstelleBaum(WURZEL,tiefe));
  }else{
    throw new Error('Unbekannter Aufruf: --pruefen | --bericht | --baum [--tiefe 1-12]');
  }
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{main();}
  catch(error){console.error('RED ION Ordnerstruktur:',error instanceof Error?error.message:String(error));process.exitCode=1;}
}
