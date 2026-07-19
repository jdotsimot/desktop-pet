const { BrowserWindow } = require('electron');
const path = require('node:path');

// Accepts watch?v=, youtu.be/, /live/, /embed/, /shorts/ forms. Returns null if
// the URL isn't YouTube or has no extractable video id.
function extractYouTubeId(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
  const ID = /^[A-Za-z0-9_-]{6,20}$/;

  if (host === 'youtu.be') {
    const id = u.pathname.slice(1).split('/')[0];
    return ID.test(id) ? id : null;
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (u.pathname === '/watch') {
      const id = u.searchParams.get('v') || '';
      return ID.test(id) ? id : null;
    }
    const m = u.pathname.match(/^\/(?:live|embed|shorts)\/([A-Za-z0-9_-]{6,20})/);
    return m ? m[1] : null;
  }
  return null;
}

// 'youtube' when a video id can be extracted, otherwise 'stream'.
function detectPresetType(url) {
  return extractYouTubeId(url) ? 'youtube' : 'stream';
}

class RadioController {
  constructor(store, broadcast) {
    this.store = store;
    this.broadcast = broadcast;
    this.win = null;
    this.playing = false;
    this.error = null;
    this.loadCheckTimer = null;
    this.onStateChanged = null; // set by main to refresh the tray
  }

  get state() {
    const { radio } = this.store.get();
    const preset = radio.presets[radio.activePreset];
    return {
      playing: this.playing,
      presetIndex: radio.activePreset,
      presetName: preset ? preset.name : null,
      volume: radio.volume,
      error: this.error,
    };
  }

  emitState() {
    this.broadcast('radio:state', this.state);
    if (this.onStateChanged) this.onStateChanged(this.state);
  }

  toggle() {
    if (this.playing) this.pause();
    else this.play();
  }

  play() {
    const { radio } = this.store.get();
    const preset = radio.presets[radio.activePreset];
    if (!preset || !preset.url) {
      this.error = 'no-station';
      this.playing = false;
      this.emitState();
      return;
    }

    this.destroyWindow();
    this.error = null;

    this.win = new BrowserWindow({
      show: false,
      width: 320,
      height: 180,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
    this.win.on('closed', () => { this.win = null; });

    const videoId = extractYouTubeId(preset.url);
    if (videoId) {
      this.win.loadURL(`https://www.youtube.com/embed/${videoId}?autoplay=1`);
    } else {
      const file = path.join(__dirname, '..', 'renderer', 'radio', 'radio.html');
      this.win.loadFile(file, {
        query: { url: preset.url, vol: String(radio.volume) },
      });
    }

    this.win.webContents.once('did-finish-load', () => {
      this.applyVolume(radio.volume);
      if (videoId) this.watchForPlaybackFailure();
    });
    this.win.webContents.on('did-fail-load', () => this.failPlayback('load-failed'));
    this.win.webContents.on('render-process-gone', () => this.failPlayback('crashed'));

    this.playing = true;
    this.emitState();
  }

  // YouTube embeds fail silently (error overlay instead of a video element) when a
  // video is not embeddable or region-blocked. Poll for a ready <video> for ~10s.
  watchForPlaybackFailure() {
    clearInterval(this.loadCheckTimer);
    let checks = 0;
    this.loadCheckTimer = setInterval(async () => {
      checks++;
      if (!this.win || this.win.isDestroyed()) {
        clearInterval(this.loadCheckTimer);
        return;
      }
      try {
        const status = await this.win.webContents.executeJavaScript(`(() => {
          if (document.querySelector('.ytp-error')) return 'error';
          const v = document.querySelector('video');
          return v && v.readyState >= 2 ? 'ok' : 'pending';
        })()`);
        if (status === 'ok') {
          clearInterval(this.loadCheckTimer);
        } else if (status === 'error' || checks >= 10) {
          this.failPlayback('not-embeddable');
        }
      } catch {
        // Page navigating; try again next tick.
      }
    }, 1000);
  }

  failPlayback(reason) {
    clearInterval(this.loadCheckTimer);
    this.destroyWindow();
    this.playing = false;
    this.error = reason;
    this.emitState();
  }

  pause() {
    clearInterval(this.loadCheckTimer);
    this.destroyWindow();
    this.playing = false;
    this.emitState();
  }

  setPreset(index) {
    const wasPlaying = this.playing;
    this.store.set({ radio: { activePreset: index } });
    if (wasPlaying) this.play();
    else this.emitState();
  }

  setVolume(volume) {
    this.store.set({ radio: { volume } });
    this.applyVolume(volume);
    this.emitState();
  }

  applyVolume(volume) {
    if (!this.win || this.win.isDestroyed()) return;
    this.win.webContents
      .executeJavaScript(
        `document.querySelectorAll('video, audio').forEach(el => { el.volume = ${Number(volume)}; })`
      )
      .catch(() => {});
  }

  // Called when presets are edited in settings: if the active preset changed or
  // was cleared while playing, restart or stop playback accordingly.
  handleSettingsChange() {
    if (!this.playing) {
      this.emitState();
      return;
    }
    const { radio } = this.store.get();
    const preset = radio.presets[radio.activePreset];
    if (!preset || !preset.url) this.pause();
  }

  destroyWindow() {
    if (this.win && !this.win.isDestroyed()) this.win.destroy();
    this.win = null;
  }
}

module.exports = { RadioController, extractYouTubeId, detectPresetType };
