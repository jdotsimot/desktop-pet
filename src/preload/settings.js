const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('settingsAPI', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (patch) => ipcRenderer.invoke('settings:set', patch),
  selectPet: (petId) => ipcRenderer.invoke('pet:select', petId),
  onSettingsChanged: (cb) => ipcRenderer.on('settings:changed', (_e, s) => cb(s)),

  radioPlay: () => ipcRenderer.invoke('radio:play'),
  radioPause: () => ipcRenderer.invoke('radio:pause'),
  radioToggle: () => ipcRenderer.invoke('radio:toggle'),
  radioSetPreset: (index) => ipcRenderer.invoke('radio:set-preset', index),
  radioSetVolume: (volume) => ipcRenderer.invoke('radio:set-volume', volume),
  radioGetState: () => ipcRenderer.invoke('radio:get-state'),
  onRadioState: (cb) => ipcRenderer.on('radio:state', (_e, s) => cb(s)),

  notifGetStatus: () => ipcRenderer.invoke('notif:get-status'),
  notifOpenPermissionUI: () => ipcRenderer.invoke('notif:open-permission-ui'),

  appInfo: () => ipcRenderer.invoke('app:info'),
});
