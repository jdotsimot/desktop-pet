const { app } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const DEFAULTS = {
  schemaVersion: 1,
  pet: { id: 'tortoise' },
  radio: {
    volume: 0.7,
    activePreset: 0,
    presets: [
      { name: 'Zeno LoFi', type: 'stream', url: 'https://stream.zeno.fm/0r0xa792kwzuv' },
      null,
      null,
      null,
      null,
    ],
  },
  notifications: { enabled: false, showAppName: true, filters: [] },
};

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

// Merges `patch` over `base` recursively. Arrays and scalars replace wholesale.
function deepMerge(base, patch) {
  const out = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (isPlainObject(value) && isPlainObject(base[key])) {
      out[key] = deepMerge(base[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

class Store {
  constructor() {
    this.filePath = path.join(app.getPath('userData'), 'settings.json');
    this.listeners = new Set();
    this.saveTimer = null;
    this.data = structuredClone(DEFAULTS);
    this.load();
  }

  load() {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      this.data = deepMerge(structuredClone(DEFAULTS), JSON.parse(raw));
    } catch {
      // Missing or corrupt file: fall back to defaults.
      this.data = structuredClone(DEFAULTS);
    }
  }

  get() {
    return this.data;
  }

  set(patch) {
    this.data = deepMerge(this.data, patch);
    this.scheduleSave();
    for (const listener of this.listeners) listener(this.data);
    return this.data;
  }

  onChange(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  scheduleSave() {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveNow(), 500);
  }

  saveNow() {
    clearTimeout(this.saveTimer);
    this.saveTimer = null;
    try {
      const tmp = this.filePath + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2));
      fs.renameSync(tmp, this.filePath);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  }
}

module.exports = { Store, DEFAULTS };
