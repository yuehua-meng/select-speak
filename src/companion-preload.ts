import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('companion', {
  getState: () => ipcRenderer.invoke('companion:state'),
  beginDrag: () => ipcRenderer.invoke('companion:drag-start'),
  endDrag: () => ipcRenderer.invoke('companion:drag-end'),
  menu: () => ipcRenderer.invoke('companion:menu'),
  onState: (callback: (value: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, value: unknown) => callback(value);
    ipcRenderer.on('companion:changed', listener);
    return () => ipcRenderer.removeListener('companion:changed', listener);
  }
});
