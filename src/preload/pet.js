const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petAPI', {
  setIgnoreMouseEvents: (ignore) =>
    ipcRenderer.send('pet:set-ignore-mouse-events', ignore, { forward: true }),
  openContextMenu: () => ipcRenderer.send('pet:open-context-menu'),
  toggleRadio: () => ipcRenderer.invoke('radio:toggle'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  onSettingsChanged: (cb) => ipcRenderer.on('settings:changed', (_e, s) => cb(s)),
  onRadioState: (cb) => ipcRenderer.on('radio:state', (_e, s) => cb(s)),
  onNotification: (cb) => ipcRenderer.on('notif:event', (_e, n) => cb(n)),
});
