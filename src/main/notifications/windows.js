// Windows notification watcher.
//
// Windows keeps recently delivered toasts in a per-user SQLite database
// (wpndatabase.db) that is readable without any special permission, package
// identity, or signing — which makes it the most maintainable option for an
// unsigned Electron app (UserNotificationListener needs package identity and
// the NodeRT bindings are abandoned). We copy the db to a temp file to dodge
// WAL lock contention, then read it with sql.js (WASM SQLite, pure JS).
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const DB_PATH = path.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
  'Microsoft', 'Windows', 'Notifications', 'wpndatabase.db'
);

let pollTimer = null;
let highWaterMark = 0; // newest Notification.Id we've reported
let SQL = null; // sql.js module, initialized lazily

function getStatus() {
  try {
    fs.accessSync(DB_PATH, fs.constants.R_OK);
    return { status: 'granted', detail: 'no-permission-needed' };
  } catch (err) {
    if (err.code === 'ENOENT') return { status: 'error', detail: 'db-not-found' };
    return { status: 'error', detail: err.code || String(err) };
  }
}

// Toast payload is a small XML document; the <text> elements hold title/body.
function parseToastTexts(xml) {
  const texts = [];
  const re = /<text[^>]*>([\s\S]*?)<\/text>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const value = m[1]
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&')
      .trim();
    if (value) texts.push(value);
  }
  return { title: texts[0] || '', body: texts.slice(1).join(' — ') };
}

function openDbCopy() {
  const tmp = path.join(os.tmpdir(), `lofipets-wpn-${process.pid}.db`);
  fs.copyFileSync(DB_PATH, tmp);
  try {
    const db = new SQL.Database(fs.readFileSync(tmp));
    return { db, cleanup: () => fs.rmSync(tmp, { force: true }) };
  } catch (err) {
    fs.rmSync(tmp, { force: true });
    throw err;
  }
}

function checkForNew(onNotification) {
  const { db, cleanup } = openDbCopy();
  try {
    const rows = db.exec(
      `SELECT n.Id, h.PrimaryId AS app, n.Payload, n.ArrivalTime
       FROM Notification n JOIN NotificationHandler h ON h.RecordId = n.HandlerId
       WHERE n.Type = 'toast' AND n.Id > ${highWaterMark}
       ORDER BY n.Id ASC LIMIT 20`
    );
    const result = rows[0];
    if (!result) return;
    for (const [id, app, payload, arrivalTime] of result.values) {
      if (id > highWaterMark) highWaterMark = id;
      const xml = Buffer.isBuffer(payload)
        ? payload.toString('utf8')
        : payload instanceof Uint8Array
          ? Buffer.from(payload).toString('utf8')
          : String(payload ?? '');
      const { title, body } = parseToastTexts(xml);
      if (!title && !body) continue;
      onNotification({
        app,
        title,
        body,
        // ArrivalTime is a Windows FILETIME (100ns ticks since 1601-01-01).
        timestamp: Math.round(Number(arrivalTime) / 10000 - 11644473600000),
      });
    }
  } finally {
    db.close();
    cleanup();
  }
}

async function start(onNotification) {
  stop();
  if (!SQL) {
    const initSqlJs = require('sql.js');
    SQL = await initSqlJs({
      locateFile: (file) =>
        path.join(require.resolve('sql.js/package.json'), '..', 'dist', file),
    });
  }

  // Prime the high-water mark so only future toasts are reported.
  try {
    const { db, cleanup } = openDbCopy();
    try {
      const rows = db.exec('SELECT MAX(Id) FROM Notification');
      highWaterMark = Number(rows[0]?.values?.[0]?.[0]) || 0;
    } finally {
      db.close();
      cleanup();
    }
  } catch {
    highWaterMark = 0;
  }

  pollTimer = setInterval(() => {
    try {
      checkForNew(onNotification);
    } catch {
      // DB busy or mid-write; try again next poll.
    }
  }, 4000);
}

function stop() {
  clearInterval(pollTimer);
  pollTimer = null;
}

module.exports = { getStatus, start, stop, DB_PATH };
