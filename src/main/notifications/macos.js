// macOS Notification Center watcher.
//
// Notification Center stores delivered notifications in an SQLite database
// inside its group container. Reading it requires Full Disk Access (there is
// no API to request FDA — the user must grant it in System Settings).
// We shell out to /usr/bin/sqlite3 (ships with macOS) so no native modules
// are needed, and decode each record's binary-plist blob with bplist-parser.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');
const bplist = require('bplist-parser');

const DB_PATH = path.join(
  os.homedir(),
  'Library/Group Containers/group.com.apple.usernotificationcenter/db2/db'
);
const CORE_DATA_EPOCH_OFFSET = 978307200; // seconds between 1970-01-01 and 2001-01-01

let pollTimer = null;
let dbWatcher = null;
let watchDebounce = null;
let highWaterMark = null; // delivered_date of the newest record we've reported

function getStatus() {
  try {
    fs.closeSync(fs.openSync(DB_PATH, 'r'));
    return { status: 'granted' };
  } catch (err) {
    if (err.code === 'EPERM' || err.code === 'EACCES') {
      return { status: 'denied', detail: 'needs-full-disk-access' };
    }
    if (err.code === 'ENOENT') {
      return { status: 'error', detail: 'db-not-found' };
    }
    return { status: 'error', detail: err.code || String(err) };
  }
}

function query(sql) {
  return new Promise((resolve, reject) => {
    execFile(
      '/usr/bin/sqlite3',
      ['-readonly', '-json', DB_PATH, sql],
      { maxBuffer: 16 * 1024 * 1024 },
      (err, stdout) => {
        if (err) return reject(err);
        const text = stdout.trim();
        resolve(text ? JSON.parse(text) : []);
      }
    );
  });
}

// The record blob is a binary plist shaped roughly like:
//   { app: 'com.example.app', req: { titl: '...', subt: '...', body: '...' }, ... }
function decodeRecord(hexBlob) {
  try {
    const [plist] = bplist.parseBuffer(Buffer.from(hexBlob, 'hex'));
    const req = plist && plist.req ? plist.req : {};
    return {
      title: req.titl || '',
      subtitle: req.subt || '',
      body: req.body || '',
    };
  } catch {
    return null;
  }
}

async function checkForNew(onNotification) {
  const rows = await query(
    `SELECT r.rec_id, a.identifier AS app_id, r.delivered_date, hex(r.data) AS data
     FROM record r JOIN app a ON a.app_id = r.app_id
     WHERE r.delivered_date > ${highWaterMark}
     ORDER BY r.delivered_date ASC LIMIT 20`
  );
  for (const row of rows) {
    if (row.delivered_date > highWaterMark) highWaterMark = row.delivered_date;
    const decoded = decodeRecord(row.data);
    if (!decoded || (!decoded.title && !decoded.body)) continue;
    onNotification({
      app: row.app_id,
      title: decoded.title || decoded.subtitle,
      body: decoded.body,
      timestamp: Math.round((row.delivered_date + CORE_DATA_EPOCH_OFFSET) * 1000),
    });
  }
}

async function start(onNotification) {
  stop();

  // Start from "now" so we only report notifications that arrive after enabling.
  const nowCoreData = Date.now() / 1000 - CORE_DATA_EPOCH_OFFSET;
  try {
    const rows = await query('SELECT MAX(delivered_date) AS maxd FROM record');
    highWaterMark = Math.max(rows[0]?.maxd || 0, 0) || nowCoreData;
  } catch {
    highWaterMark = nowCoreData;
  }

  const poll = () => checkForNew(onNotification).catch(() => {});

  // fs.watch on the WAL file gives near-instant wakeups; the interval is the
  // reliability fallback (fs.watch is historically flaky on this directory).
  try {
    dbWatcher = fs.watch(path.dirname(DB_PATH), () => {
      clearTimeout(watchDebounce);
      watchDebounce = setTimeout(poll, 500);
    });
  } catch {
    dbWatcher = null;
  }
  pollTimer = setInterval(poll, 5000);
}

function stop() {
  clearInterval(pollTimer);
  clearTimeout(watchDebounce);
  pollTimer = null;
  if (dbWatcher) {
    dbWatcher.close();
    dbWatcher = null;
  }
}

module.exports = { getStatus, start, stop, DB_PATH };
