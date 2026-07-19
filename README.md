# Lofi Pets 🐢👻🦀🤖🐱🍡

A tiny desktop companion that lives on top of your screen. Pick a pet, tune the
lofi radio, and let your buddy read out your desktop notifications.

All art is pure CSS — no sprites, no images.

## Pets

| Pet | Personality |
|---|---|
| 🐢 Sage the Tortoise | The original. Slow, zen, occasionally judgmental. |
| 👻 Boo the Ghost | Floats around the screen; fades away when overwhelmed. |
| 🦀 Clawde the Crab | Coral-colored, walks sideways, raises claws when petted. |
| 🤖 Bitty the Robot | Blinking antenna; powers down if you boop it too much. |
| 🐱 Mocha the Lofi Cat | Wears headphones, nods to the beat, naps aggressively. |
| 🍡 Mochi the Blob | Hops everywhere; retreats by becoming a pancake. |

Switch pets any time in **Settings → Pets** — no restart needed.

## Features

- **Transparent overlay** — your pet walks over whatever you're doing; clicks
  pass through everywhere except the pet itself.
- **Radio with 5 presets** — paste a direct audio stream URL *or* a YouTube
  link (24/7 lofi live channels work great). Control from the tray, the
  right-click menu, the settings window, or by triple-clicking your pet.
- **Notification mirroring** — optionally, your pet announces desktop
  notifications from other apps in its speech bubble
  (see [Permissions](#notification-permissions)).
- **Drag to move**, click to pet, and don't click too much — every pet has its
  own way of telling you it needs a moment.

## Controls

| Action | Result |
|---|---|
| Click | Pet your buddy (happy hop + occasional wisdom) |
| Triple-click | Toggle the radio |
| Click & drag | Move your buddy anywhere |
| 6+ rapid clicks | Too much! They retreat for a few seconds |
| Right-click pet | Quick menu: radio, settings, quit |
| Tray icon | Radio play/pause, station picker, settings, quit |

## Install

Grab the latest release from the
[Releases page](../../releases):

### macOS (.dmg)

The app is not code-signed (no $99/yr Apple certificate), so the first launch
needs one extra step:

1. Open the `.dmg` and drag **Lofi Pets** to Applications.
2. Either **right-click the app → Open → Open**, or run:
   ```sh
   xattr -cr "/Applications/Lofi Pets.app"
   ```
3. Launch normally from then on.

### Windows (.exe)

Run the installer. SmartScreen will warn about an unknown publisher —
click **More info → Run anyway**.

## Notification permissions

- **macOS**: reading Notification Center requires **Full Disk Access**
  (System Settings → Privacy & Security → Full Disk Access → add Lofi Pets).
  The Settings → Notifications page walks you through it and shows live status.
- **Windows**: no special permission needed — it just works.
- Mirroring is **off by default**; enable it in Settings → Notifications.

## Development

```sh
npm install
npm start
```

Useful scripts:

| Script | What it does |
|---|---|
| `npm start` | Run the app in dev mode |
| `npm run gen-icons` | Regenerate app/tray icons from `assets/*.svg` |
| `npm run dist:mac` | Build the macOS `.dmg` (universal) |
| `npm run dist:win` | Build the Windows installer |

Notes:

- In dev mode, macOS Full Disk Access applies to your **terminal app**, not the
  Electron binary — grant it to your terminal to test notification mirroring.
- The pet lives on the **primary display**; multi-monitor support is not a thing yet.
- Adding a pet: drop a `<name>.js` + `<name>.css` into `src/renderer/pet/pets/`
  following any existing pet as a template, then reference them from
  `src/renderer/pet/index.html` and `src/renderer/settings/settings.html`,
  and add the id to `PET_ORDER` in `settings.js`.

## Architecture (short version)

- `src/main/` — Electron main process: windows, tray, settings store (plain
  JSON in `userData`), radio controller (hidden playback window), and
  per-platform notification watchers.
- `src/preload/` — `contextBridge` APIs; renderers run sandboxed with
  `contextIsolation: true` and no Node access.
- `src/renderer/pet/` — the overlay window: a shared state-machine engine plus
  a registry of CSS-art pet definitions.
- `src/renderer/settings/` — the settings window.
