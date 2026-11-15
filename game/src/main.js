// Emberkeep boot: the fixed-step loop, screen keys, and the ?shot= mode that
// stages a deterministic scene, renders it twice and freezes for the camera.
import { STEP, VIEW } from './config.js';
import { createInput } from './input.js';
import { World, SCREEN_OVER, SCREEN_PAUSE, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './world.js';
import { render } from './render.js';
import { stageShot } from './shots.js';
import { initAudio, isMuted, setMuted, startMusic, stopMusic } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const world = new World();

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

let last = performance.now();
let accumulator = 0;
let shotReady = false;

function startShot() {
  world.seed = seed;
  const staged = stageShot(shotName, world);
  // Render twice so gradients and the darkness layer settle, then freeze.
  render(ctx, world);
  render(ctx, world);
  window.__shotReady = true;
  shotReady = true;
  document.title = `Emberkeep — shot ${shotName} (${staged.screen})`;
}

function frame(now) {
  if (shotReady) return;
  requestAnimationFrame(frame);
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.25) dt = 0.25;
  accumulator += dt;

  // Screen keys, checked once a frame.
  const s = world.state;
  if (input.consumePressed('enter') || input.consumeClick()) {
    initAudio();
    if (s.screen === SCREEN_TITLE) {
      world.startGame();
      startMusic();
    } else if (s.screen === SCREEN_OVER || s.screen === SCREEN_WIN) {
      world.startGame();
      startMusic();
    } else if (s.screen === SCREEN_PAUSE) {
      s.screen = SCREEN_PLAY;
      startMusic();
    }
  }
  if (input.consumePressed('p') || input.consumePressed('escape')) {
    if (s.screen === SCREEN_PLAY) {
      s.screen = SCREEN_PAUSE;
      stopMusic();
    } else if (s.screen === SCREEN_PAUSE) {
      s.screen = SCREEN_PLAY;
      startMusic();
    }
  }
  if (input.consumePressed('r')) {
    if (s.screen !== SCREEN_TITLE) {
      world.startGame();
      startMusic();
    }
  }
  if (input.consumePressed('m')) {
    setMuted(!isMuted());
    if (!isMuted() && s.screen === SCREEN_PLAY) startMusic();
  }
  if (input.consumePressed(' ')) initAudio();

  while (accumulator >= STEP) {
    accumulator -= STEP;
    if (s.screen === SCREEN_PLAY || s.screen === SCREEN_TITLE || s.screen === SCREEN_OVER || s.screen === SCREEN_WIN) {
      world.step(STEP, input.frame());
    }
  }
  render(ctx, world);
  input.endFrame();

  if (s.screen === SCREEN_OVER || s.screen === SCREEN_WIN) stopMusic();
}

if (shotName) {
  startShot();
} else {
  requestAnimationFrame(frame);
}

export { VIEW };
