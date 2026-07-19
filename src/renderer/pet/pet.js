// Shared pet engine: drives whichever pet from window.PetRegistry is selected
// in settings. States are pet-agnostic classes (is-idle / is-walking /
// is-happy / is-retreated); each pet's CSS decides what they look like.
const pet = document.getElementById('pet');
const petBody = document.getElementById('pet-body');
const speechBubble = document.getElementById('speech-bubble');

let def = null;            // active pet definition
let state = 'idle';
let posX = 0;
let posY = 0;
let clickCount = 0;
let lastClickTime = 0;
let facingLeft = false;

let wanderTimer = null;
let idleSpeechTimer = null;
let walkEndTimer = null;
let retreatTimer = null;
let speechTimer = null;

const rand = (min, max) => min + Math.random() * (max - min);

// --- Speech -----------------------------------------------------------------
const speechQueue = [];
let speechShowing = false;

function showSpeech(content, ms = 4000) {
  if (speechShowing) {
    if (speechQueue.length < 3) speechQueue.push([content, ms]);
    return;
  }
  speechShowing = true;
  if (typeof content === 'string') {
    speechBubble.textContent = content;
  } else {
    speechBubble.replaceChildren(content);
  }
  speechBubble.classList.remove('hidden');
  clearTimeout(speechTimer);
  speechTimer = setTimeout(() => {
    speechBubble.classList.add('hidden');
    speechShowing = false;
    const next = speechQueue.shift();
    if (next) setTimeout(() => showSpeech(next[0], next[1]), 550);
  }, ms);
}

function randomPhrase() {
  return def.phrases[Math.floor(Math.random() * def.phrases.length)];
}

// --- State machine ----------------------------------------------------------
function setStateClass(name) {
  pet.classList.remove('is-idle', 'is-walking', 'is-happy', 'is-retreated');
  pet.classList.add(name);
}

function resetToIdle() {
  state = 'idle';
  setStateClass('is-idle');
  clickCount = 0;
}

function groundY() {
  return window.innerHeight - def.size.h - 10;
}

function beHappy() {
  if (state === 'retreated') return;
  state = 'happy';
  setStateClass('is-happy');

  const baseTop = posY;
  pet.style.setProperty('--top-ms', '300ms');
  pet.style.top = `${baseTop - 15}px`;
  setTimeout(() => {
    pet.style.top = `${baseTop}px`;
    setTimeout(() => {
      if (state === 'happy') resetToIdle();
    }, 300);
  }, 300);
}

function retreat() {
  state = 'retreated';
  setStateClass('is-retreated');
  showSpeech(def.behaviors.retreatMessage);
  clearTimeout(retreatTimer);
  retreatTimer = setTimeout(() => {
    if (state === 'retreated') comeOut();
  }, def.behaviors.retreatMs);
}

function comeOut() {
  clearTimeout(retreatTimer);
  resetToIdle();
  showSpeech(def.behaviors.returnMessage);
}

// --- Wandering --------------------------------------------------------------
function walkRandomly() {
  state = 'walking';
  setStateClass('is-walking');

  const direction = Math.random() > 0.5 ? 1 : -1;
  const distance = rand(def.movement.distance[0], def.movement.distance[1]);

  let newX = posX + direction * distance;
  const maxX = window.innerWidth - def.size.w - 40;
  if (newX < 40) newX = 40 + rand(0, 60);
  if (newX > maxX) newX = maxX - rand(0, 60);

  const walkTime = rand(def.movement.speed[0], def.movement.speed[1]);
  pet.style.setProperty('--walk-ms', `${Math.round(walkTime)}ms`);

  posX = newX;
  pet.style.left = `${posX}px`;

  if (def.movement.mode === 'float') {
    const minY = window.innerHeight * 0.45;
    const maxY = window.innerHeight - def.size.h - 20;
    posY = rand(minY, maxY);
    pet.style.setProperty('--top-ms', `${Math.round(walkTime)}ms`);
    pet.style.top = `${posY}px`;
  }

  if (def.movement.flips) {
    facingLeft = direction < 0;
    petBody.style.transform = facingLeft ? 'scaleX(-1)' : 'scaleX(1)';
  }

  clearTimeout(walkEndTimer);
  walkEndTimer = setTimeout(() => {
    if (state === 'walking') resetToIdle();
  }, walkTime);
}

// --- Interaction ------------------------------------------------------------
let isDragging = false;
let didDrag = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let mouseDownAt = null;

petBody.addEventListener('click', (e) => {
  e.stopPropagation();
  if (didDrag) {
    didDrag = false;
    return;
  }

  const now = Date.now();
  clickCount = now - lastClickTime > 400 ? 1 : clickCount + 1;
  lastClickTime = now;

  if (state === 'retreated') {
    comeOut();
    return;
  }
  if (clickCount === 3) {
    window.petAPI.toggleRadio();
    return;
  }
  if (clickCount >= 6) {
    retreat();
    clickCount = 0;
    return;
  }
  beHappy();
  if (Math.random() > 0.5) showSpeech(randomPhrase());
});

pet.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  window.petAPI.openContextMenu();
});

// Drag-to-move: threshold of 5px separates a click from a drag.
pet.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  mouseDownAt = { x: e.screenX, y: e.screenY };
  dragOffsetX = e.clientX - posX;
  dragOffsetY = e.clientY - posY;
});

window.addEventListener('mousemove', (e) => {
  if (!mouseDownAt) return;
  if (!isDragging) {
    const moved = Math.hypot(e.screenX - mouseDownAt.x, e.screenY - mouseDownAt.y);
    if (moved < 5) return;
    isDragging = true;
    didDrag = true;
    pet.classList.add('dragging');
    clearTimeout(walkEndTimer);
    if (state !== 'retreated') {
      state = 'idle';
      setStateClass('is-idle');
    }
  }
  posX = Math.min(Math.max(e.clientX - dragOffsetX, 0), window.innerWidth - def.size.w);
  posY = Math.min(Math.max(e.clientY - dragOffsetY, -10), window.innerHeight - def.size.h);
  pet.style.left = `${posX}px`;
  pet.style.top = `${posY}px`;
});

window.addEventListener('mouseup', (e) => {
  mouseDownAt = null;
  if (!isDragging) return;
  isDragging = false;
  // Ground pets settle back to the floor after being dropped.
  if (def.movement.mode === 'ground') {
    requestAnimationFrame(() => {
      pet.classList.remove('dragging');
      pet.style.setProperty('--top-ms', '600ms');
      posY = groundY();
      pet.style.top = `${posY}px`;
    });
  } else {
    requestAnimationFrame(() => pet.classList.remove('dragging'));
  }
  const overPet = document.elementFromPoint(e.clientX, e.clientY);
  if (!overPet || !pet.contains(overPet)) {
    window.petAPI.setIgnoreMouseEvents(true);
  }
});

// Click-through: the window ignores the mouse except while over the pet.
pet.addEventListener('mouseenter', () => window.petAPI.setIgnoreMouseEvents(false));
pet.addEventListener('mouseleave', () => {
  if (isDragging) return;
  window.petAPI.setIgnoreMouseEvents(true);
});

// --- Radio + notification reactions -----------------------------------------
let radioWasPlaying = false;

window.petAPI.onRadioState((radioState) => {
  if (radioState.error) {
    const messages = {
      'not-embeddable': "That station won't tune in...",
      'no-station': 'No station set! Check settings.',
      'load-failed': 'Radio static... try again?',
      crashed: 'The radio broke. Rebooting it helps.',
    };
    showSpeech(messages[radioState.error] || 'Radio hiccup...');
  } else if (radioState.playing) {
    showSpeech(`♪ ${radioState.presetName || 'Radio on'}`);
  } else if (radioWasPlaying) {
    showSpeech('Music off.');
  }
  radioWasPlaying = radioState.playing;
});

window.petAPI.onNotification((n) => {
  const wrapper = document.createElement('span');
  const settingsShowApp = showAppName && n.app;
  if (settingsShowApp) {
    const app = document.createElement('span');
    app.className = 'notif-app';
    app.textContent = prettyAppName(n.app);
    wrapper.appendChild(app);
  }
  const title = document.createElement('span');
  title.className = 'notif-title';
  title.textContent = n.title || 'New notification';
  wrapper.appendChild(title);
  if (n.body) {
    const body = document.createElement('span');
    body.className = 'notif-body';
    body.textContent = n.body.length > 80 ? n.body.slice(0, 77) + '...' : n.body;
    wrapper.appendChild(body);
  }
  showSpeech(wrapper, 6000);
});

// 'com.tinyspeck.slackmacgap' -> 'Slackmacgap' is imperfect but readable;
// most bundle ids end in the product name.
function prettyAppName(id) {
  const last = String(id).split('.').pop() || String(id);
  return last.charAt(0).toUpperCase() + last.slice(1);
}

// --- Lifecycle --------------------------------------------------------------
let showAppName = true;

function teardown() {
  clearInterval(wanderTimer);
  clearInterval(idleSpeechTimer);
  clearTimeout(walkEndTimer);
  clearTimeout(retreatTimer);
  pet.className = '';
  petBody.style.transform = '';
}

function init(petId) {
  teardown();
  def = window.PetRegistry[petId] || window.PetRegistry.tortoise;

  pet.style.width = `${def.size.w}px`;
  pet.style.height = `${def.size.h}px`;
  pet.className = `pet--${def.id}`;
  petBody.innerHTML = def.markup;

  posX = Math.min(posX || window.innerWidth - 140, window.innerWidth - def.size.w - 40);
  posY = groundY();
  pet.style.left = `${posX}px`;
  pet.style.top = `${posY}px`;

  resetToIdle();

  wanderTimer = setInterval(() => {
    if (state === 'idle' && !isDragging && Math.random() > 0.3) walkRandomly();
  }, 3000);

  idleSpeechTimer = setInterval(() => {
    if (state === 'idle' && Math.random() > 0.8) showSpeech(randomPhrase());
  }, 12000);
}

window.petAPI.onSettingsChanged((settings) => {
  showAppName = settings.notifications.showAppName;
  if (def && settings.pet.id !== def.id) init(settings.pet.id);
});

window.petAPI.getSettings().then((settings) => {
  showAppName = settings.notifications.showAppName;
  init(settings.pet.id);
});
