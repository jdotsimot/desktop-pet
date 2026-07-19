// Platform dispatch for notification mirroring. Failures always degrade to a
// status change — never a crash, never a pet-visible error.
const { app, shell } = require('electron');

const impl =
  process.platform === 'darwin' ? require('./macos')
  : process.platform === 'win32' ? require('./windows')
  : null;

class NotificationManager {
  constructor(store, broadcast) {
    this.store = store;
    this.broadcast = broadcast;
    this.running = false;
  }

  getStatus() {
    if (!impl) return { platform: process.platform, status: 'unsupported' };
    const { status, detail } = impl.getStatus();
    return { platform: process.platform, status, detail, isPackaged: app.isPackaged };
  }

  openPermissionUI() {
    if (process.platform === 'darwin') {
      shell.openExternal(
        'x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles'
      );
    }
  }

  // Starts or stops the watcher to match settings + permission state.
  sync() {
    const enabled = this.store.get().notifications.enabled;
    const shouldRun = enabled && impl && this.getStatus().status === 'granted';
    if (shouldRun && !this.running) {
      this.running = true;
      Promise.resolve(
        impl.start((notification) => this.broadcast('notif:event', notification))
      ).catch(() => { this.running = false; });
    } else if (!shouldRun && this.running) {
      impl.stop();
      this.running = false;
    }
  }

  stop() {
    if (impl && this.running) impl.stop();
    this.running = false;
  }
}

module.exports = { NotificationManager };
