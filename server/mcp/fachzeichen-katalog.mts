/* Erzeugt server/mcp/fachzeichen-katalog.ts aus dem Register der App.
 *
 *   node server/mcp/fachzeichen-katalog.mts           schreibt die Datei
 *   node server/mcp/fachzeichen-katalog.mts --pruefen prüft nur, ob sie aktuell ist
 *
 * Warum erzeugt und nicht abgeschrieben: die Lage eines Anschlusses nach
 * Drehen und Spiegeln rechnet `Register.fachzeichen.anschlussLage`. Eine
 * zweite Drehmatrix im Server liefe auseinander (§8 „keine doppelten
 * Kataloge"). Hier läuft der GEBAUTE Registercode selbst in einer
 * Sandbox, und der Server bekommt nur die Ergebnisse als Daten.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const QUELLE = path.join(REPO, 'quell/register/fachzeichen.js');
const ZIEL = path.join(REPO, 'server/mcp/fachzeichen-katalog.ts');

export const katalogText = (): string => {
  const ctx: Record<string, unknown> = { window: {} as Record<string, unknown> };
  (ctx.window as Record<string, unknown>).Register = {};
  ctx.Register = (ctx.window as Record<string, unknown>).Register;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(QUELLE, 'utf8'), ctx, { filename: 'fachzeichen.js' });
  const F = (ctx.Register as any).fachzeichen;
  const eintraege = F.alle().map((z: any) => {
    const lagen: Record<string, Record<string, [number, number]>> = {};
    for (const dreh of [0, 90, 180, 270]) for (const sp of [false, true]) {
      const key = dreh + (sp ? 'g' : '');
      lagen[key] = {};
      for (const a of z.anschluesse) {
        const o = F.anschlussLage(z.id, a.nr, dreh, sp);
        if (o) lagen[key]![a.nr] = [o.x, o.y];
      }
    }
    return { id: z.id, name: z.name, gruppe: z.gruppe, kennbuchstabe: z.kennbuchstabe || '',
      w: z.w, h: z.h, erklaerung: String(z.erklaerung || ''), anschluesse: z.anschluesse.map((a: any) => a.nr), lagen };
  });
  return '/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: quell/register/fachzeichen.js ' +
    '(node server/mcp/fachzeichen-katalog.mts). */\n' +
    'export type Symbol = { id: string; name: string; gruppe: string; kennbuchstabe: string; w: number; h: number;\n' +
    '  erklaerung: string; anschluesse: string[]; lagen: Record<string, Record<string, [number, number]>> };\n' +
    'export const RASTER = ' + Number(F.RASTER) + ';\n' +
    'export const SYMBOLE: Symbol[] = ' + JSON.stringify(eintraege) + ';\n';
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const text = katalogText();
  if (process.argv.includes('--pruefen')) {
    const da = fs.existsSync(ZIEL) ? fs.readFileSync(ZIEL, 'utf8') : '';
    if (da !== text) { console.error('fachzeichen-katalog.ts ist nicht aktuell — node server/mcp/fachzeichen-katalog.mts'); process.exit(1); }
    console.log('fachzeichen-katalog.ts aktuell');
  } else {
    fs.writeFileSync(ZIEL, text);
    console.log('fachzeichen-katalog.ts geschrieben —', (text.length / 1024).toFixed(0), 'KB');
  }
}
