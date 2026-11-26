// Kleinstmögliche Brücke: keine Pfade, keine beliebigen IPC-Kanäle,
// kein Node-Zugriff, keine Electron-Events im Web-Kontext.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('RedionDesktop', Object.freeze({
  platform: 'windows',
  windowChrome: process.platform === 'win32',
  nvidiaTicket: process.platform === 'win32' ? () => ipcRenderer.invoke('redion:ki:nvidia:ticket') as Promise<string> : undefined,
  windowTheme: (theme: 'light' | 'dark') => ipcRenderer.invoke('redion:fenster:thema', theme),
  windowMenu: (x: number, y: number) => ipcRenderer.invoke('redion:fenster:menue', x, y),
  automationSupported: process.platform === 'win32',
  automationState: () => ipcRenderer.invoke('redion:automation:state'),
  automationOpenPackage: () => ipcRenderer.invoke('redion:automation:package'),
  automationConfigure: (policy: unknown) => ipcRenderer.invoke('redion:automation:configure', policy),
  automationDisconnect: () => ipcRenderer.invoke('redion:automation:disconnect'),
  automationRevokeClient: (id: string) => ipcRenderer.invoke('redion:automation:revoke', id),
  automationReady: () => ipcRenderer.invoke('redion:automation:ready'),
  onAutomationRequest: (callback: (request: { id: string; tool: string; arguments: Record<string, unknown> }) => Promise<unknown>) => {
    const listener = (_event: unknown, request: { id: string; tool: string; arguments: Record<string, unknown> }) => {
      if (request && typeof request.id === 'string' && typeof request.tool === 'string') void callback(request);
    };
    ipcRenderer.on('redion:automation:request', listener);
    return () => ipcRenderer.removeListener('redion:automation:request', listener);
  },
  automationReply: (reply: unknown) => ipcRenderer.invoke('redion:automation:reply', reply),
  onAutomationCancel: (callback: (id?: string) => void) => {
    const listener = (_event: unknown, id?: string) => callback(id);
    ipcRenderer.on('redion:automation:cancel', listener);
    return () => ipcRenderer.removeListener('redion:automation:cancel', listener);
  },
  onAutomationState: (callback: () => void) => {
    const listener = () => callback(); ipcRenderer.on('redion:automation:state', listener);
    return () => ipcRenderer.removeListener('redion:automation:state', listener);
  },
  pending: () => ipcRenderer.invoke('redion:files:list'),
  pick: () => ipcRenderer.invoke('redion:files:pick'),
  read: (id: string, offset: number) => ipcRenderer.invoke('redion:files:read', id, offset),
  release: (id: string) => ipcRenderer.invoke('redion:files:release', id),
  saveBegin: (name: string, size: number) => ipcRenderer.invoke('redion:save:begin', name, size),
  saveWrite: (id: string, bytes: Uint8Array) => ipcRenderer.invoke('redion:save:write', id, bytes),
  saveCommit: (id: string) => ipcRenderer.invoke('redion:save:commit', id),
  saveCancel: (id: string) => ipcRenderer.invoke('redion:save:cancel', id),
  takeDestination: () => ipcRenderer.invoke('redion:ziel:holen'),
  onDestination: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('redion:ziel:bereit', listener);
    return () => ipcRenderer.removeListener('redion:ziel:bereit', listener);
  },
  onFiles: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('redion:files:available', listener);
    return () => ipcRenderer.removeListener('redion:files:available', listener);
  }
}));
export {};
