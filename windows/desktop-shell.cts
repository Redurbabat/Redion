'use strict';
/*
 * Windows-Alltag ohne Electron-Abhängigkeit, damit es ohne Fenster prüfbar ist:
 * Sprungliste der Taskleiste und gemerkte Fensterlage.
 */
type Area = { x: number; y: number; width: number; height: number };
type WindowState = Area & { maximized: boolean };
const DESTINATIONS = Object.freeze([
  { id: 'neu', title: 'Neue Seite', description: 'Eine leere Seite anlegen' },
  { id: 'heute', title: 'Heute', description: 'Die Tagesübersicht öffnen' },
  { id: 'dokumente', title: 'Dokumente', description: 'Die Bibliothek öffnen' },
  { id: 'lernen', title: 'Lernen', description: 'Den Lernbereich öffnen' }
]);
const PREFIX = '--redion-ziel=';

/** Ein Ziel aus der Befehlszeile; alles ausserhalb der festen Liste zählt nicht. */
function destinationFromArgs(args: readonly unknown[] | undefined): string | null {
  for (const value of args || []) {
    if (typeof value !== 'string' || !value.startsWith(PREFIX)) continue;
    const id = value.slice(PREFIX.length);
    if (DESTINATIONS.some(destination => destination.id === id)) return id;
  }
  return null;
}

function jumpTasks(program: string) {
  return DESTINATIONS.map(destination => ({
    program,
    arguments: PREFIX + destination.id,
    title: destination.title,
    description: destination.description,
    iconPath: program,
    iconIndex: 0
  }));
}

/* Eine Lage gilt nur, wenn mindestens 120 × 80 px davon auf einem heutigen
 * Bildschirm liegen: sonst öffnet sich das Fenster nach dem Abstecken eines
 * zweiten Monitors unsichtbar im Nirgendwo. */
function readWindowState(read: () => string, workAreas: readonly Area[]): WindowState | null {
  let state: Partial<WindowState> & Partial<Area>;
  try { state = JSON.parse(read()); } catch { return null; }
  const { x, y, width, height } = state ?? {};
  if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y) || !Number.isSafeInteger(width) || !Number.isSafeInteger(height)) return null;
  const box = { x: x as number, y: y as number, width: width as number, height: height as number };
  if (box.width < 860 || box.height < 580) return null;
  const visible = workAreas.some(area =>
    Math.min(box.x + box.width, area.x + area.width) - Math.max(box.x, area.x) >= 120 &&
    Math.min(box.y + box.height, area.y + area.height) - Math.max(box.y, area.y) >= 80);
  if (!visible) return null;
  return { ...box, maximized: state.maximized === true };
}

function windowStateToSave(bounds: Area, maximized: boolean): WindowState {
  return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, maximized: !!maximized };
}

module.exports = { DESTINATIONS, destinationFromArgs, jumpTasks, readWindowState, windowStateToSave };
