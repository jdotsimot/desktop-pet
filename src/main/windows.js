const { BrowserWindow, screen } = require('electron');
const path = require('node:path');

let petWindow = null;
let settingsWindow = null;

function createPetWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  petWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: false,
    skipTaskbar: true,
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'pet.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  petWindow.setAlwaysOnTop(true, 'screen-saver');
  if (process.platform === 'darwin') {
    petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreenSpaces: true });
  }
  petWindow.setIgnoreMouseEvents(true, { forward: true });
  petWindow.loadFile(path.join(__dirname, '..', 'renderer', 'pet', 'index.html'));
  petWindow.on('closed', () => { petWindow = null; });

  return petWindow;
}

function getPetWindow() {
  return petWindow;
}

function openSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    return settingsWindow;
  }

  settingsWindow = new BrowserWindow({
    width: 760,
    height: 560,
    minWidth: 640,
    minHeight: 460,
    title: 'Lofi Pets Settings',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'settings.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  settingsWindow.loadFile(path.join(__dirname, '..', 'renderer', 'settings', 'settings.html'));
  settingsWindow.on('closed', () => { settingsWindow = null; });

  return settingsWindow;
}

function getSettingsWindow() {
  return settingsWindow;
}

// Sends to every open renderer that should hear about app-level state.
function broadcast(channel, payload) {
  for (const win of [petWindow, settingsWindow]) {
    if (win && !win.isDestroyed()) {
      win.webContents.send(channel, payload);
    }
  }
}

module.exports = { createPetWindow, getPetWindow, openSettingsWindow, getSettingsWindow, broadcast };
