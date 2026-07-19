window.PetRegistry = window.PetRegistry || {};
window.PetRegistry.blob = {
  id: 'blob',
  name: 'Mochi the Blob',
  size: { w: 56, h: 66 },
  markup: `
    <div class="b-blob">
      <div class="b-eye left"></div>
      <div class="b-eye right"></div>
      <div class="b-cheek left"></div>
      <div class="b-cheek right"></div>
      <div class="b-mouth"></div>
      <div class="b-shine"></div>
    </div>`,
  movement: { mode: 'ground', speed: [1400, 3000], distance: [100, 320], flips: true },
  behaviors: {
    retreatMessage: '*becomes pancake*',
    retreatMs: 5000,
    returnMessage: '*re-inflates* hi again!',
  },
  phrases: [
    'boing~',
    'i am 90% squish',
    'soft. round. present.',
    'wobble responsibly',
    'today\'s mood: gelatinous',
    'squish happens',
    'bounce with me!',
    'i contain multitudes (of squish)',
  ],
};
