/* Suite 262 — Hausaufgaben und Lernziele je Fach (E256)
 * ============================================================================
 * Die zwei Poster-Zeilen der Schulsäule, die noch fehlten: „Hausaufgaben
 * mit Fach-Bezug und Lernziele je Fach". Beides sind Datenbankzeilen aus
 * der Vorlage (§9, kein zweiter Katalog) — die Lernwelt zeigt sie im
 * Schul-Dashboard und auf der Fachseite und kann den Haken setzen.
 *
 * §1 DIE VORLAGE legt homework und goals an — nachträglich auf einem
 *    Bestand ergänzt sie nur, was fehlt.
 * §2 DAS SCHUL-DASHBOARD zeigt beide Sektionen, offen zuerst, Überfälliges
 *    mit dem WORT „überfällig" (§38).
 * §3 DER HAKEN wirkt: ein Klick schreibt die Checkbox-Spalte der Zeile
 *    (setProp), die Ansicht zeigt es, die Zahl sinkt.
 * §4 DIE FACHSEITE filtert über die Fach-Relation: Elektrotechnik sieht
 *    seine Aufgabe und sein Ziel, Deutsch nur seins (§47-Leerfall).
 * §5 AM TELEFON ist der Haken fingertauglich (§37).
 *
 *   node pruefungen/lauf/test262.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9029;

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => { server.listen(PORT, () => f()); });

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1360, height: 950 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(() => typeof Store !== 'undefined' &&
  typeof (globalThis as any).Produktwelten !== 'undefined' &&
  typeof (globalThis as any).Galerie !== 'undefined', null, { timeout: 30000 });
await seite.waitForTimeout(1200);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
});

console.log('\n1 · Die Vorlage legt homework und goals an');
const kinds = await seite.evaluate(() => {
  (globalThis as any).Galerie.bauen('ausbildung');
  return Object.values<any>(Store.cache.collections)
    .filter(c => c && c.schoolKind).map(c => String(c.schoolKind)).sort();
}) as string[];
p('homework und goals stehen neben den sechs bekannten Fächern',
  kinds.includes('homework') && kinds.includes('goals') && kinds.includes('timetable'),
  kinds.join(', '));

/* Zwei Fächer, drei Hausaufgaben (eine überfällig, eine erledigt), zwei
   Lernziele — verknüpft über die echte Fach-Relation. */
const saat = await seite.evaluate(() => {
  const sammlung = (kind: string) => Object.values<any>(Store.cache.collections)
    .find(c => c && c.schoolKind === kind);
  const key = (c: any, typ: string, wort: string) =>
    Object.keys(c.schema || {}).find(k => c.schema[k]?.type === typ &&
      String(c.schema[k]?.name || '').toLowerCase().includes(wort)) ||
    Object.keys(c.schema || {}).find(k => c.schema[k]?.type === typ) || '';
  const subjects = sammlung('subjects');
  const et = Store.addRow(subjects.id, { title: 'Elektrotechnik' });
  const de = Store.addRow(subjects.id, { title: 'Deutsch' });
  const hw = sammlung('homework');
  const hwSubj = key(hw, 'relation', 'fach');
  const hwDue = key(hw, 'date', 'fällig');
  const hwDone = key(hw, 'checkbox', 'erledigt');
  const morgen = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const a1 = Store.addRow(hw.id, { title: 'Ohmsches Gesetz Serie 3' });
  Store.setProp(a1.id, hwSubj, [et.id]); Store.setProp(a1.id, hwDue, morgen);
  const a2 = Store.addRow(hw.id, { title: 'Aufsatz überarbeiten' });
  Store.setProp(a2.id, hwSubj, [de.id]); Store.setProp(a2.id, hwDue, '2020-01-05');
  const a3 = Store.addRow(hw.id, { title: 'Formelblatt abschreiben' });
  Store.setProp(a3.id, hwSubj, [et.id]); Store.setProp(a3.id, hwDone, true);
  const go = sammlung('goals');
  const goSubj = key(go, 'relation', 'fach');
  const goStand = key(go, 'status', 'stand') || key(go, 'select', 'stand');
  const z1 = Store.addRow(go.id, { title: 'Reihenschaltung sicher rechnen' });
  Store.setProp(z1.id, goSubj, [et.id]); Store.setProp(z1.id, goStand, 'In Arbeit');
  const z2 = Store.addRow(go.id, { title: 'Erörterung aufbauen können' });
  Store.setProp(z2.id, goSubj, [de.id]);
  return { et: et.id, de: de.id, a1: a1.id, a2: a2.id, a3: a3.id, z1: z1.id };
}) as any;

console.log('\n2 · Das Schul-Dashboard zeigt beide Sektionen');
await seite.evaluate(() => (globalThis as any).Produktwelten.lernen('schule'));
await seite.waitForTimeout(900);
const dash = await seite.evaluate(() => {
  const text = (document.querySelector('.lw-school') as HTMLElement)?.textContent || '';
  const hwListe = document.querySelector('.lw-school .lw-hw-list');
  const erste = hwListe?.querySelector('li strong')?.textContent || '';
  return {
    hausaufgaben: text.includes('Hausaufgaben'), lernziele: text.includes('Lernziele'),
    offenZahl: /2 offen/.test(text),
    ueberfaellig: text.includes('überfällig'),
    ersteOffen: erste,
    stand: text.includes('In Arbeit'),
    haken: !!document.querySelector('.lw-school [data-lw-hw-done]')
  };
});
p('Beide Sektionen stehen da, mit „2 offen" am Kopf',
  dash.hausaufgaben && dash.lernziele && dash.offenZahl, JSON.stringify(dash));
p('Die überfällige Aufgabe steht oben und trägt das WORT „überfällig" (§38)',
  dash.ueberfaellig && dash.ersteOffen.includes('Aufsatz'), JSON.stringify(dash));
p('Das Lernziel zeigt seinen Stand in Worten', dash.stand, JSON.stringify(dash));

console.log('\n3 · Der Haken wirkt');
await seite.click('.lw-school [data-lw-hw-done="' + saat.a2 + '"]');
await seite.waitForTimeout(500);
const nachHaken = await seite.evaluate((id: string) => {
  const row = Store.getBlock(id);
  const c = Store.getCollection(row.parentId);
  const doneKey = Object.keys(c.schema || {}).find(k => c.schema[k]?.type === 'checkbox') || '';
  const text = (document.querySelector('.lw-school') as HTMLElement)?.textContent || '';
  const li = document.querySelector('.lw-school [data-lw-hw-done="' + id + '"]')?.closest('li');
  return { gespeichert: !!row.props?.[doneKey],
           zahl: /1 offen/.test(text),
           klasse: li?.className || '',
           gedrueckt: document.querySelector('.lw-school [data-lw-hw-done="' + id + '"]')
             ?.getAttribute('aria-pressed') };
}, saat.a2) as any;
p('Der Klick schreibt die Checkbox-Spalte der Zeile',
  nachHaken.gespeichert, JSON.stringify(nachHaken));
p('Die Ansicht zieht nach: „1 offen", Zeile als erledigt markiert, aria-pressed sagt es',
  nachHaken.zahl && /ist-erledigt/.test(nachHaken.klasse) && nachHaken.gedrueckt === 'true',
  JSON.stringify(nachHaken));

console.log('\n4 · Die Fachseite filtert über die Relation');
await seite.evaluate((fachId: string) => {
  (globalThis as any).Produktwelten.lernen('schule');
  const knopf = document.querySelector<HTMLElement>('[data-lw-subject="' + fachId + '"]');
  knopf?.click();
}, saat.et);
await seite.waitForTimeout(700);
const fachEt = await seite.evaluate(() => {
  const text = (document.querySelector('.lw-subject') as HTMLElement)?.textContent || '';
  return { ohm: text.includes('Ohmsches Gesetz'), aufsatz: text.includes('Aufsatz'),
           ziel: text.includes('Reihenschaltung'), fremdZiel: text.includes('Erörterung'),
           kennzahl: /1\s*offene Hausaufgaben/.test(text.replace(/\s+/g, ' ')) };
});
p('Elektrotechnik sieht seine Aufgabe und sein Ziel — und nicht die von Deutsch',
  fachEt.ohm && !fachEt.aufsatz && fachEt.ziel && !fachEt.fremdZiel, JSON.stringify(fachEt));
p('Die Kennzahl zählt nur die offenen dieses Fachs', fachEt.kennzahl, JSON.stringify(fachEt));
/* Erst zurück aufs Dashboard — die Fächerknöpfe stehen nur dort. Der
   erste Wurf klickte ins Leere und mass weiter die Elektrotechnik-Seite. */
await seite.click('[data-lw-action="subject-back"]');
await seite.waitForTimeout(500);
await seite.click('[data-lw-subject="' + saat.de + '"]');
await seite.waitForTimeout(600);
const fachDe = await seite.evaluate(() => {
  const text = (document.querySelector('.lw-subject') as HTMLElement)?.textContent || '';
  return { aufsatz: text.includes('Aufsatz'), ohm: text.includes('Ohmsches Gesetz') };
}) as any;
p('Deutsch sieht nur seins', fachDe.aufsatz && !fachDe.ohm, JSON.stringify(fachDe));

console.log('\n5 · Am Telefon ist der Haken fingertauglich');
await seite.setViewportSize({ width: 390, height: 844 });
await seite.evaluate(() => {
  (globalThis as any).Produktwelten.lernen('schule');
  /* §4 liess die Fachseite offen — zurück aufs Dashboard. */
  (document.querySelector('[data-lw-action="subject-back"]') as HTMLElement | null)?.click();
});
await seite.waitForTimeout(700);
const handy = await seite.evaluate(() => {
  const k = document.querySelector('.lw-hw-check');
  const r = k?.getBoundingClientRect();
  return r ? { h: Math.round(r.height), b: Math.round(r.width) } : null;
});
p('Der Haken ist mindestens 44 px gross (§37)',
  !!handy && handy.h >= 44 && handy.b >= 44, JSON.stringify(handy));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));
await browser.close(); server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
