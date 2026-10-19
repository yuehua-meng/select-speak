import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('audioEngine', {
  onCommand(callback: (command: unknown) => void) { ipcRenderer.on('audio:command', (_event, command) => callback(command)); },
  report(value: unknown) { ipcRenderer.send('audio:report', value); }
});
