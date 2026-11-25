import { DrawingDock } from './adapter.js';
import type { CanvasCommand, DrawingDockHost } from './adapter.js';
import { readSettings } from './model.js';
import type { Settings, Tool } from './model.js';

// Kein Ersatz für Marken/Schaltplan. Der jeweilige Host bleibt alleiniger Eigentümer seiner Daten.
export interface ExistingDrawingPort {
  root: HTMLElement;
  documentId: string;
  tools: readonly Tool[];
  commands: readonly CanvasCommand[];
  settingsKeys: readonly (keyof Settings)[];
  settings?: unknown;
  canEdit: () => boolean;
  onTool: (tool:Tool)=>void;
  onCommand: (command:CanvasCommand)=>void;
  onSettings?: (settings:Settings)=>void;
  onError?: (error:unknown)=>void;
}
export function mountExistingDock(port:ExistingDrawingPort) {
  let settings=readSettings(port.settings);
  let disposed=false;
  const host:DrawingDockHost={
    root:port.root,
    supportedTools:port.tools,
    supportedCommands:port.commands,
    supportedSettings:port.settingsKeys,
    getSettings:()=>({...settings}),
    updateSettings:patch=>{
      if(disposed)return;
      const next=readSettings({...settings,...patch});
      if(patch.tool!==undefined){
        if(!port.canEdit()||!port.tools.includes(next.tool))return;
        port.onTool(next.tool);
      }
      const layoutOnly=Object.keys(patch).every(k=>['x','y','vertical','minimized'].includes(k));
      if(!layoutOnly&&!port.canEdit())return;
      settings=next;port.onSettings?.({...settings});dock.refresh();
    },
    command:cmd=>{
      if(!disposed&&port.canEdit()&&port.commands.includes(cmd))port.onCommand(cmd);
    },
    onError:error=>port.onError?.(error)
  };
  const dock=new DrawingDock(host);
  return {
    documentId:port.documentId,
    updateFromHost(value:unknown){if(!disposed){settings=readSettings(value);dock.refresh();}},
    dispose(){if(!disposed){disposed=true;dock.dispose();}}
  };
}
