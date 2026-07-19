const { Tray, Menu, nativeImage } = require('electron');
const path = require('node:path');

let tray = null;

function trayIcon() {
  const file =
    process.platform === 'darwin'
      ? path.join(__dirname, '..', '..', 'assets', 'trayTemplate.png')
      : path.join(__dirname, '..', '..', 'assets', 'tray-win.png');
  const img = nativeImage.createFromPath(file);
  if (process.platform === 'darwin') img.setTemplateImage(true);
  return img;
}

function buildMenu({ store, radio, openSettings, quit }) {
  const { radio: radioSettings } = store.get();
  const state = radio.state;

  const stationItems = radioSettings.presets.map((preset, i) => ({
    label: preset && preset.name ? preset.name : `(empty slot ${i + 1})`,
    type: 'radio',
    checked: radioSettings.activePreset === i,
    enabled: Boolean(preset && preset.url),
    click: () => radio.setPreset(i),
  }));

  return Menu.buildFromTemplate([
    { label: 'Lofi Pets', enabled: false },
    { type: 'separator' },
    {
      label: state.playing ? 'Pause Radio' : 'Play Radio',
      click: () => radio.toggle(),
    },
    { label: 'Station', submenu: stationItems },
    { type: 'separator' },
    { label: 'Settings…', click: openSettings },
    { type: 'separator' },
    { label: 'Quit Lofi Pets', click: quit },
  ]);
}

function createTray(ctx) {
  tray = new Tray(trayIcon());
  tray.setToolTip('Lofi Pets');
  refreshTray(ctx);
  return tray;
}

function refreshTray(ctx) {
  if (!tray || tray.isDestroyed()) return;
  tray.setContextMenu(buildMenu(ctx));
  const state = ctx.radio.state;
  tray.setToolTip(
    state.playing && state.presetName ? `Lofi Pets — ♪ ${state.presetName}` : 'Lofi Pets'
  );
}

module.exports = { createTray, refreshTray, buildMenu };
