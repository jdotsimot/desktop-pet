window.PetRegistry = window.PetRegistry || {};
window.PetRegistry.robot = {
  id: 'robot',
  name: 'Bitty the Robot',
  size: { w: 54, h: 82 },
  markup: `
    <div class="r-antenna"><div class="r-antenna-tip"></div></div>
    <div class="r-head">
      <div class="r-screen">
        <div class="r-eye left"></div>
        <div class="r-eye right"></div>
      </div>
    </div>
    <div class="r-torso"><div class="r-light"></div></div>
    <div class="r-foot left"></div>
    <div class="r-foot right"></div>`,
  movement: { mode: 'ground', speed: [1600, 3200], distance: [120, 380], flips: true },
  behaviors: {
    retreatMessage: 'ERR: TOO_MANY_BOOPS. Powering down.',
    retreatMs: 5000,
    returnMessage: 'Reboot complete.',
  },
  phrases: [
    'beep boop.',
    '01101100 01101111 01100110 01101001',
    'Executing chill.exe',
    'My battery is vibes.',
    'Have you tried turning me off and on?',
    'Scanning... no bugs found. Suspicious.',
    'I dream of electric sheep.',
    'Firmware update: more cozy.',
  ],
};
