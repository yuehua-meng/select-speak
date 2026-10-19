import { contextBridge, ipcRenderer } from 'electron';
import type { AppState, DesktopAPI, Settings } from './shared';
const api: DesktopAPI = {
  getState: () => ipcRenderer.invoke('state:get'),
  saveSettings: (value: Settings) => ipcRenderer.invoke('settings:save', value),
  speakSelection: (id: number) => ipcRenderer.invoke('speech:selection', id),
  speakTest: () => ipcRenderer.invoke('speech:test'),
  stopSpeech: () => ipcRenderer.invoke('speech:stop'),
  hidePopup: () => ipcRenderer.invoke('popup:hide'),
  popupHover: hovered => ipcRenderer.send('popup:hover', hovered),
  openSettings: () => ipcRenderer.invoke('settings:open'),
  restart: () => ipcRenderer.invoke('services:restart'),
  quit: () => ipcRenderer.invoke('app:quit'),
  onState: callback => {
    const listener = (_: Electron.IpcRendererEvent, state: AppState) => callback(state);
    ipcRenderer.on('state:changed', listener);
    return () => ipcRenderer.removeListener('state:changed', listener);
  }
};
contextBridge.exposeInMainWorld('desktop', api);
