let settings = null;

// --- Navigation --------------------------------------------------------------
document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.section').forEach((s) => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`section-${btn.dataset.section}`).classList.add('active');
    if (btn.dataset.section === 'notifications') startPermPolling();
    else stopPermPolling();
  });
});

// --- Pets --------------------------------------------------------------------
const PET_ORDER = ['tortoise', 'ghost', 'crab', 'robot', 'cat', 'blob'];

function renderPetGrid() {
  const grid = document.getElementById('pet-grid');
  grid.replaceChildren();
  for (const id of PET_ORDER) {
    const def = window.PetRegistry[id];
    if (!def) continue;
    const card = document.createElement('div');
    card.className = 'pet-card' + (settings.pet.id === id ? ' selected' : '');
    card.dataset.petId = id;

    const preview = document.createElement('div');
    preview.className = 'preview';
    // Reuses the real pet CSS: same class structure as the pet window.
    const stage = document.createElement('div');
    stage.className = `stage pet--${id} is-idle`;
    const body = document.createElement('div');
    body.className = 'pet-body';
    body.innerHTML = def.markup;
    stage.appendChild(body);
    preview.appendChild(stage);

    const name = document.createElement('div');
    name.className = 'pet-name';
    name.textContent = def.name;

    card.append(preview, name);
    card.addEventListener('click', async () => {
      settings = await window.settingsAPI.selectPet(id);
      renderPetGrid();
    });
    grid.appendChild(card);
  }
}

// --- Radio -------------------------------------------------------------------
const presetList = document.getElementById('preset-list');
const volumeSlider = document.getElementById('volume');
const volumeLabel = document.getElementById('volume-label');
const radioToggle = document.getElementById('radio-toggle');
const radioStatus = document.getElementById('radio-status');

let presetSaveTimer = null;

function renderRadio() {
  volumeSlider.value = settings.radio.volume;
  volumeLabel.textContent = `${Math.round(settings.radio.volume * 100)}%`;
  renderPresets();
}

function renderPresets() {
  presetList.replaceChildren();
  settings.radio.presets.forEach((preset, i) => {
    const row = document.createElement('div');
    row.className = 'preset';

    const active = document.createElement('input');
    active.type = 'radio';
    active.name = 'active-preset';
    active.checked = settings.radio.activePreset === i;
    active.disabled = !(preset && preset.url);
    active.title = 'Set as active station';
    active.addEventListener('change', () => window.settingsAPI.radioSetPreset(i));

    const name = document.createElement('input');
    name.type = 'text';
    name.placeholder = `Station ${i + 1} name`;
    name.value = preset?.name || '';

    const url = document.createElement('input');
    url.type = 'text';
    url.placeholder = 'https://youtube.com/watch?v=… or stream URL';
    url.value = preset?.url || '';

    const save = () => {
      clearTimeout(presetSaveTimer);
      presetSaveTimer = setTimeout(async () => {
        const presets = settings.radio.presets.map((p, j) => {
          if (j !== i) return p;
          const newUrl = url.value.trim();
          if (!newUrl) return null;
          return { name: name.value.trim() || `Station ${i + 1}`, url: newUrl };
        });
        settings = await window.settingsAPI.setSettings({ radio: { presets } });
        renderPresets();
      }, 600);
    };
    name.addEventListener('input', save);
    url.addEventListener('input', save);

    const clear = document.createElement('button');
    clear.className = 'clear-btn';
    clear.textContent = '✕';
    clear.title = 'Clear this preset';
    clear.addEventListener('click', async () => {
      const presets = settings.radio.presets.map((p, j) => (j === i ? null : p));
      settings = await window.settingsAPI.setSettings({ radio: { presets } });
      renderPresets();
    });

    row.append(active, name, url, clear);
    presetList.appendChild(row);
  });
}

volumeSlider.addEventListener('input', () => {
  const v = Number(volumeSlider.value);
  volumeLabel.textContent = `${Math.round(v * 100)}%`;
  window.settingsAPI.radioSetVolume(v);
});

radioToggle.addEventListener('click', () => window.settingsAPI.radioToggle());

function renderRadioState(state) {
  radioToggle.textContent = state.playing ? '⏸ Pause' : '▶ Play';
  radioStatus.className = 'radio-status';
  if (state.error) {
    radioStatus.classList.add('error');
    const messages = {
      'not-embeddable':
        'That YouTube video does not allow embedding — try another stream.',
      'no-station': 'No station selected. Add a preset below.',
      'load-failed': 'Could not load that stream.',
      crashed: 'Playback crashed. Press play to retry.',
    };
    radioStatus.textContent = messages[state.error] || 'Playback error.';
  } else if (state.playing) {
    radioStatus.classList.add('playing');
    radioStatus.textContent = `♪ Now playing: ${state.presetName || 'station'}`;
  } else {
    radioStatus.textContent = 'Stopped';
  }
}

// --- Notifications -----------------------------------------------------------
const notifEnabled = document.getElementById('notif-enabled');
const notifShowApp = document.getElementById('notif-show-app');
const permPill = document.getElementById('perm-pill');
const permCopy = document.getElementById('perm-copy');
const permGrant = document.getElementById('perm-grant');

let permPollTimer = null;

notifEnabled.addEventListener('change', async () => {
  settings = await window.settingsAPI.setSettings({
    notifications: { enabled: notifEnabled.checked },
  });
  refreshPermStatus();
});

notifShowApp.addEventListener('change', async () => {
  settings = await window.settingsAPI.setSettings({
    notifications: { showAppName: notifShowApp.checked },
  });
});

permGrant.addEventListener('click', () => window.settingsAPI.notifOpenPermissionUI());

async function refreshPermStatus() {
  const info = await window.settingsAPI.notifGetStatus();
  permPill.className = 'pill';
  permGrant.classList.add('hidden');

  if (info.status === 'granted') {
    permPill.classList.add('granted');
    permPill.textContent = 'Granted';
    permCopy.textContent =
      info.platform === 'win32'
        ? 'No special permission is needed on Windows. You are all set.'
        : 'Full Disk Access is granted. Your pet can see incoming notifications.';
  } else if (info.status === 'denied') {
    permPill.classList.add('denied');
    permPill.textContent = 'Needs access';
    const target = info.isPackaged
      ? 'add Lofi Pets to the list'
      : 'add your terminal app (running in dev mode) to the list';
    permCopy.textContent =
      `macOS requires Full Disk Access to read Notification Center. ` +
      `Open System Settings → Privacy & Security → Full Disk Access and ${target}, ` +
      `then relaunch the app if it does not pick up the change.`;
    permGrant.classList.remove('hidden');
  } else if (info.status === 'unsupported') {
    permPill.classList.add('error');
    permPill.textContent = 'Unsupported';
    permCopy.textContent = 'Notification mirroring is not supported on this OS.';
  } else {
    permPill.classList.add('error');
    permPill.textContent = 'Unavailable';
    permCopy.textContent =
      'Could not find the system notification database on this OS version — ' +
      'mirroring is not supported here yet.';
  }
}

function startPermPolling() {
  refreshPermStatus();
  clearInterval(permPollTimer);
  permPollTimer = setInterval(refreshPermStatus, 3000);
}

function stopPermPolling() {
  clearInterval(permPollTimer);
  permPollTimer = null;
}

// --- About -------------------------------------------------------------------
async function renderAbout() {
  const info = await window.settingsAPI.appInfo();
  document.getElementById('about-version').textContent =
    `Lofi Pets v${info.version} · Electron ${info.electron} · ${info.platform}`;
}

// --- Init --------------------------------------------------------------------
function renderAll() {
  renderPetGrid();
  renderRadio();
  notifEnabled.checked = settings.notifications.enabled;
  notifShowApp.checked = settings.notifications.showAppName;
}

window.settingsAPI.onSettingsChanged((s) => {
  settings = s;
  // Don't clobber preset inputs while the user is typing.
  if (!document.activeElement || !presetList.contains(document.activeElement)) {
    renderAll();
  }
});

window.settingsAPI.onRadioState(renderRadioState);

(async () => {
  settings = await window.settingsAPI.getSettings();
  renderAll();
  renderAbout();
  renderRadioState(await window.settingsAPI.radioGetState());
})();
