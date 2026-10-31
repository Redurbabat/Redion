// Kleinstmögliche Brücke: keine Pfade, keine beliebigen IPC-Kanäle,
// kein Node-Zugriff, keine Electron-Events im Web-Kontext.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('RedionDesktop', Object.freeze({
  platform: 'windows',
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
