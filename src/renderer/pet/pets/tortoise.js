window.PetRegistry = window.PetRegistry || {};
window.PetRegistry.tortoise = {
  id: 'tortoise',
  name: 'Sage the Tortoise',
  size: { w: 60, h: 80 },
  markup: `
    <div class="head"><div class="eye"></div></div>
    <div class="shell"></div>
    <div class="body"></div>
    <div class="legs">
      <div class="leg front"></div>
      <div class="leg back"></div>
    </div>`,
  movement: { mode: 'ground', speed: [2000, 5000], distance: [100, 400], flips: true },
  behaviors: {
    retreatMessage: 'Too much touching!',
    retreatMs: 5000,
    returnMessage: "I'm back.",
  },
  phrases: [
    'Slow is smooth...',
    'Keep it lofi.',
    'Just keep crawling.',
    'Shell is life.',
    'Enjoy the drift.',
    'Zzz...',
    'Is it snack time?',
    'Watching you code...',
    'Take a breath.',
    'Looking good.',
  ],
};
