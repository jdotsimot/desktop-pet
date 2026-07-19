window.PetRegistry = window.PetRegistry || {};
window.PetRegistry.cat = {
  id: 'cat',
  name: 'Mocha the Lofi Cat',
  size: { w: 66, h: 78 },
  markup: `
    <div class="k-tail"></div>
    <div class="k-body"></div>
    <div class="k-head">
      <div class="k-ear left"></div>
      <div class="k-ear right"></div>
      <div class="k-band"></div>
      <div class="k-cup left"></div>
      <div class="k-cup right"></div>
      <div class="k-eye left"></div>
      <div class="k-eye right"></div>
      <div class="k-nose"></div>
    </div>
    <div class="k-leg front"></div>
    <div class="k-leg back"></div>`,
  movement: { mode: 'ground', speed: [1800, 4000], distance: [120, 420], flips: true },
  behaviors: {
    retreatMessage: 'Nap time. Do not perceive me.',
    retreatMs: 6000,
    returnMessage: '*stretches* ...I allow pets again.',
  },
  phrases: [
    'These beats are purrfect.',
    '*vibing to the lofi*',
    'Headphones stay ON.',
    'Push commits, not my buttons.',
    'mrrp.',
    'The keyboard looked warm...',
    'Chasing the cursor later. Maybe.',
    'One more loop of this track.',
  ],
};
