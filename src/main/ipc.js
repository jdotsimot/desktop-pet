const { ipcMain, BrowserWindow, Menu } = require('electron');
const { detectPresetType } = require('./radio');

// All ipcMain registrations live here. `ctx` carries { store, radio,
// notifications, broadcast, openSettings, refreshTray, quit }.
function registerIpc(ctx) {
  const { store, radio, notifications, broadcast } = ctx;

  // --- Pet window ---
  ipcMain.on('pet:set-ignore-mouse-events', (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.setIgnoreMouseEvents(ignore, options);
  });

  ipcMain.on('pet:open-context-menu', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const state = radio.state;
    const menu = Menu.buildFromTemplate([
      {
        label: state.playing ? 'Pause Radio' : 'Play Radio',
        click: () => radio.toggle(),
      },
      { label: 'Settings…', click: ctx.openSettings },
      { type: 'separator' },
      { label: 'Quit Lofi Pets', click: ctx.quit },
    ]);
    menu.popup({ window: win });
  });

  // --- Settings ---
  ipcMain.handle('settings:get', () => store.get());

  ipcMain.handle('settings:set', (_event, patch) => {
    // Presets carry a derived `type` so playback picks the right pipeline.
    if (patch && patch.radio && Array.isArray(patch.radio.presets)) {
      patch.radio.presets = patch.radio.presets.map((preset) =>
        preset && preset.url ? { ...preset, type: detectPresetType(preset.url) } : preset
      );
    }
    const next = store.set(patch);
    broadcast('settings:changed', next);
    radio.handleSettingsChange();
    notifications.sync();
    ctx.refreshTray();
    return next;
  });

  ipcMain.handle('pet:select', (_event, petId) => {
    const next = store.set({ pet: { id: petId } });
    broadcast('settings:changed', next);
    return next;
  });

  // --- Radio ---
  ipcMain.handle('radio:toggle', () => radio.toggle());
  ipcMain.handle('radio:play', () => radio.play());
  ipcMain.handle('radio:pause', () => radio.pause());
  ipcMain.handle('radio:set-preset', (_event, index) => radio.setPreset(index));
  ipcMain.handle('radio:set-volume', (_event, volume) => radio.setVolume(volume));
  ipcMain.handle('radio:get-state', () => radio.state);

  // --- About page ---
  ipcMain.handle('app:info', () => ({
    version: require('electron').app.getVersion(),
    platform: process.platform,
    electron: process.versions.electron,
  }));

  // --- Notifications ---
  ipcMain.handle('notif:get-status', () => notifications.getStatus());
  ipcMain.handle('notif:open-permission-ui', () => notifications.openPermissionUI());
}

module.exports = { registerIpc };
