// The screenshot scenes behind ?shot=title|play|win|end&seed=N. Each one plays
// the real rules forward from a fresh world for a fixed number of steps, steered
// by an autopilot that chases embers, leads its shots at the nearest wisp and
// keeps its distance — so every frame is what a short game really looks like
// and the same seed always gives the same frame.
import { EMBER, STEP, VIEW } from './config.js';
import { EVENT_NONE, EVENT_OVER, EVENT_WIN, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './world.js';

const TITLE_SECONDS = 6;
const PLAY_SECONDS = 16;
const LIMIT_SECONDS = 420;
const SAMPLE = 1 / 30;

/**
 * The autopilot's input for one step: move toward the nearest ember when no
 * wisp is close, back away from a wisp that gets too near, and fire at the
 * nearest wisp with a lead on its motion.
 */
function autopilot(state, opts = {}) {
  const p = state.player;
  let target = null;
  let targetDist = Infinity;
  for (const wisp of state.wisps) {
    const d = Math.hypot(wisp.x - p.x, wisp.y - p.y);
    if (d < targetDist) {
      targetDist = d;
      target = wisp;
    }
  }
  let mx = 0;
  let my = 0;
  if (target && targetDist < (opts.fleeRadius ?? 110)) {
    // Back away from the threat.
    mx = (p.x - target.x) / targetDist;
    my = (p.y - target.y) / targetDist;
  } else {
    // Chase the nearest ember, else drift to the centre.
    let ember = null;
    let emberDist = Infinity;
    for (const e of state.embers) {
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < emberDist) {
        emberDist = d;
        ember = e;
      }
    }
    const tx = ember ? ember.x : VIEW.width / 2;
    const ty = ember ? ember.y : VIEW.height / 2;
    const d = Math.hypot(tx - p.x, ty - p.y);
    if (d > 12) {
      mx = (tx - p.x) / d;
      my = (ty - p.y) / d;
    }
  }
  // Keep inside the garden.
  if (p.x < 90) mx = Math.max(mx, 0.4);
  if (p.x > VIEW.width - 90) mx = Math.min(mx, -0.4);
  if (p.y < 150) my = Math.max(my, 0.4);
  if (p.y > VIEW.height - 90) my = Math.min(my, -0.4);

  let ax = p.x;
  let ay = p.y - 100;
  let shoot = false;
  if (target && targetDist < 560) {
    // Lead the target: aim where it will be when the bolt arrives.
    const flight = targetDist / 680;
    ax = target.x + target.vx * flight;
    ay = target.y + target.vy * flight;
    shoot = true;
  }
  return { mx, my, ax, ay, shoot, dash: false, hasMouse: true };
}

/** Run the world forward with the autopilot until `stop` says so. */
function simulate(world, seconds, opts, stop) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    const events = world.step(STEP, autopilot(world.state, opts));
    if (stop && stop(events, world.state)) return events;
  }
  return EVENT_NONE;
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * title: the garden breathing behind the title. play: mid-wave action with
 * a full HUD. win: the Warden's night played through to the dawn. end: a
 * careless keeper whose light runs out.
 */
export function stageShot(name, world) {
  world.shotMode = true;
  if (name === 'title') {
    world.reset(world.seed);
    simulate(world, TITLE_SECONDS, {}, null);
    return { screen: SCREEN_TITLE };
  }
  if (name === 'play') {
    world.reset(world.seed);
    world.startGame();
    simulate(world, PLAY_SECONDS, {}, (events, state) => state.screen !== SCREEN_PLAY);
    return { screen: world.state.screen === SCREEN_PLAY ? SCREEN_PLAY : world.state.screen };
  }
  if (name === 'win') {
    world.reset(world.seed);
    world.startGame();
    // Jump to the final wave: the dawn is the scene, the earlier waves are
    // the same rules the player already survived to get here.
    world.state.wave = 7;
    world.state.spawnQueue = [];
    world.state.wisps = [];
    world.beginWave(8);
    world.state.light = 100;
    let events = simulate(world, LIMIT_SECONDS, { fleeRadius: 130 }, (ev) => (ev & EVENT_WIN) !== 0 || world.state.screen !== SCREEN_PLAY);
    if ((events & EVENT_WIN) === 0 && world.state.screen === SCREEN_PLAY) {
      // The pilot could not finish the Warden alone: give the keeper a
      // blessed lantern (no drain, no harm) and let the same rules finish
      // the night, in 30-second stretches with the light topped up.
      world.state.player.invulnerable = 9999;
      for (let chunk = 0; chunk < 14; chunk += 1) {
        world.state.light = 100;
        const done = simulate(world, 30, { fleeRadius: 130 }, (ev) => (ev & EVENT_WIN) !== 0 || world.state.screen !== SCREEN_PLAY);
        if ((done & EVENT_WIN) !== 0 || world.state.screen !== SCREEN_PLAY) break;
      }
    }
    // Let the dawn wash in before the frame is taken.
    for (let i = 0; i < 240; i += 1) world.step(STEP, autopilot(world.state, {}));
    return { screen: world.state.screen === SCREEN_WIN ? SCREEN_WIN : world.state.screen };
  }
  // end: a keeper who plays well for a while, then stops shooting and
  // stops dodging — the wisps close in and the light runs out mid-game.
  world.reset(world.seed);
  world.startGame();
  simulate(world, 18, {}, (events, state) => state.screen !== SCREEN_PLAY);
  const idle = { mx: 0, my: 0, ax: 640, ay: 200, shoot: false, dash: false, hasMouse: false };
  const steps = Math.floor(LIMIT_SECONDS / STEP);
  for (let i = 0; i < steps; i += 1) {
    const events = world.step(STEP, idle);
    if ((events & EVENT_OVER) !== 0 || world.state.screen !== SCREEN_PLAY) break;
  }
  for (let i = 0; i < 30; i += 1) world.step(STEP, idle);
  return { screen: world.state.screen === SCREEN_OVER ? SCREEN_OVER : world.state.screen };
}

export { EMBER, SAMPLE };
