window.PetRegistry = window.PetRegistry || {};
window.PetRegistry.crab = {
  id: 'crab',
  name: 'Clawde the Crab',
  size: { w: 70, h: 72 },
  markup: `
    <div class="c-eyestalk left"><div class="c-eye"></div></div>
    <div class="c-eyestalk right"><div class="c-eye"></div></div>
    <div class="c-claw left"></div>
    <div class="c-claw right"></div>
    <div class="c-shell">
      <div class="c-smile"></div>
    </div>
    <div class="c-legs left"><i></i><i></i><i></i></div>
    <div class="c-legs right"><i></i><i></i><i></i></div>`,
  // Crabs walk sideways: no sprite flip needed.
  movement: { mode: 'ground', speed: [1200, 2600], distance: [140, 380], flips: false },
  behaviors: {
    retreatMessage: 'Snip snap! Personal space!',
    retreatMs: 5000,
    returnMessage: 'Okay. We are cool now.',
  },
  phrases: [
    'I am helpful, harmless, and shellfish.',
    'Sideways is the fastest way forward.',
    'Claw-ding in progress...',
    'Thinking... deeply... about snacks.',
    'I would rate this desktop 5 claws.',
    'Molting is just refactoring.',
    'Stay salty.',
    'Beach vibes, office hours.',
  ],
};
