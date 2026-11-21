/* Erzeugt server/mcp/blockarten-katalog.ts aus Register.bloecke der App.
 *
 *   node server/mcp/blockarten-katalog.mts           schreibt die Datei
 *   node server/mcp/blockarten-katalog.mts --pruefen prüft nur, ob sie aktuell ist
 *
 * Der Server soll nur Blockarten anlegen, die die App kennt — und die Liste
 * dafür nicht selbst führen (§8). Hier läuft der GEBAUTE Registercode in
 * einer Sandbox; der Server bekommt Kennung, Name und Gruppe als Daten.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const QUELLE = path.join(REPO, 'quell/register/bloecke.js');
const ZIEL = path.join(REPO, 'server/mcp/blockarten-katalog.ts');

export const katalogText = (): string => {
  const win: Record<string, unknown> = { Register: {} };
  const ctx: Record<string, unknown> = { window: win, Register: win.Register };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(QUELLE, 'utf8'), ctx, { filename: 'bloecke.js' });
  const B = (ctx.Register as any).bloecke;
  const arten = B.alle().map((x: any) => ({ id: String(x.id), name: String(x.name || x.id), gruppe: String(x.gruppe || '') }));
  return '/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: quell/register/bloecke.js ' +
    '(node server/mcp/blockarten-katalog.mts). */\n' +
    'export type Blockart = { id: string; name: string; gruppe: string };\n' +
    'export const BLOCKARTEN: Blockart[] = ' + JSON.stringify(arten) + ';\n';
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const text = katalogText();
  if (process.argv.includes('--pruefen')) {
    const da = fs.existsSync(ZIEL) ? fs.readFileSync(ZIEL, 'utf8') : '';
    if (da !== text) { console.error('blockarten-katalog.ts ist nicht aktuell — node server/mcp/blockarten-katalog.mts'); process.exit(1); }
    console.log('blockarten-katalog.ts aktuell');
  } else {
    fs.writeFileSync(ZIEL, text);
    console.log('blockarten-katalog.ts geschrieben —', (text.match(/"id":/g) || []).length, 'Arten');
  }
}
