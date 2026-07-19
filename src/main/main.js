const { app } = require('electron');
const { Store } = require('./store');
const windows = require('./windows');
const { RadioController } = require('./radio');
const { NotificationManager } = require('./notifications');
const { createTray, refreshTray } = require('./tray');
const { registerIpc } = require('./ipc');

// Radio playback happens in a hidden window with no user gesture.
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.whenReady().then(() => {
    // Tray app: no dock icon on macOS.
    if (process.platform === 'darwin' && app.dock) app.dock.hide();

    const store = new Store();
    const radio = new RadioController(store, windows.broadcast);
    const notifications = new NotificationManager(store, windows.broadcast);

    const ctx = {
      store,
      radio,
      notifications,
      broadcast: windows.broadcast,
      openSettings: () => windows.openSettingsWindow(),
      refreshTray: () => refreshTray(ctx),
      quit: () => app.quit(),
    };

    radio.onStateChanged = () => refreshTray(ctx);

    registerIpc(ctx);
    windows.createPetWindow();
    createTray(ctx);
    notifications.sync();

    app.on('second-instance', () => windows.openSettingsWindow());

    app.on('before-quit', () => {
      radio.destroyWindow();
      notifications.stop();
      store.saveNow();
    });
  });

  // Tray app: closing the settings window must not quit the app.
  app.on('window-all-closed', () => {});
}
