window.PetRegistry = window.PetRegistry || {};
window.PetRegistry.ghost = {
  id: 'ghost',
  name: 'Boo the Ghost',
  size: { w: 56, h: 78 },
  markup: `
    <div class="g-sheet">
      <div class="g-eye left"></div>
      <div class="g-eye right"></div>
      <div class="g-mouth"></div>
      <div class="g-blush left"></div>
      <div class="g-blush right"></div>
      <div class="g-tail"><i></i><i></i><i></i></div>
    </div>`,
  movement: { mode: 'float', speed: [1500, 3500], distance: [120, 420], flips: true },
  behaviors: {
    retreatMessage: '...you can\'t see me...',
    retreatMs: 5000,
    returnMessage: 'boo!',
  },
  phrases: [
    'ooooOOOoo...',
    'i haunt this desktop now',
    'transparency is my thing',
    'do you believe in me?',
    'floating > walking',
    'zzz (do ghosts sleep?)',
    'i saw that typo',
    'spooky vibes only',
  ],
};
