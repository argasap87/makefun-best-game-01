// The game itself: screens, waves, scoring, collisions and the win/lose rules.
// main.js owns the loop and the drawing; this file owns what happens each step.
import { EMBER, MAX_WAVE, PLAYER, SCORE, STEP, VIEW, waveComposition } from './config.js';
import { makeRng, range } from './random.js';
import {
  KIND_WARDEN,
  createPlayer,
  edgeSpawn,
  maybeDrop,
  spawnBolt,
  spawnEmber,
  spawnParticles,
  spawnPowerup,
  spawnWisp,
  updateBolt,
  updateEmber,
  updateParticle,
  updatePowerup,
  updateWisp,
} from './entities.js';
import {
  playHit,
  playHurt,
  playPickup,
  playPower,
  playShoot,
  playSunburst,
  playWave,
} from './audio.js';

export const EVENT_NONE = 0;
export const EVENT_OVER = 1;
export const EVENT_WIN = 2;
export const EVENT_WAVE_CLEAR = 4;

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSE = 'pause';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

const BEST_KEY = 'emberkeep-best';

export function loadBest() {
  try {
    return Number(window.localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // A private window loses the best score; the game goes on.
  }
}

export class World {
  constructor() {
    this.rng = makeRng(1);
    this.seed = 1;
    this.state = null;
    this.shotMode = false;
    this.reset(1);
  }

  reset(seed) {
    this.seed = seed;
    this.rng = makeRng(seed);
    this.state = {
      screen: SCREEN_TITLE,
      time: 0,
      score: 0,
      emberCount: 0,
      wave: 0,
      light: PLAYER.maxLight,
      best: loadBest(),
      multiplier: 1,
      comboTimer: 0,
      kills: 0,
      shotsFired: 0,
      shotsHit: 0,
      player: createPlayer(),
      wisps: [],
      embers: [],
      bolts: [],
      powerups: [],
      particles: [],
      floats: [],
      spawnQueue: [],
      spawnTimer: 0,
      banner: '',
      bannerTimer: 0,
      waveClearTimer: 0,
      shake: 0,
      flash: 0,
      dawn: 0,
      fireflies: [],
      garden: [],
    };
    const s = this.state;
    for (let i = 0; i < 26; i += 1) {
      s.fireflies.push({
        x: range(this.rng, 20, VIEW.width - 20),
        y: range(this.rng, 90, VIEW.height - 20),
        phase: range(this.rng, 0, Math.PI * 2),
        speed: range(this.rng, 0.4, 1.4),
      });
    }
    for (let i = 0; i < 90; i += 1) {
      s.garden.push({
        x: range(this.rng, 0, VIEW.width),
        y: range(this.rng, 80, VIEW.height),
        kind: Math.floor(this.rng() * 3),
        size: range(this.rng, 3, 9),
        hue: range(this.rng, 0, 1),
      });
    }
    for (let i = 0; i < 7; i += 1) s.embers.push(spawnEmber(this.rng));
    this.attractWisps(4);
  }

  // A few wisps drift behind the title screen so it is alive, not empty.
  attractWisps(count) {
    for (let i = 0; i < count; i += 1) {
      this.state.wisps.push(spawnWisp(this.rng, 'drifter'));
    }
  }

  startGame() {
    const s = this.state;
    s.screen = SCREEN_PLAY;
    s.score = 0;
    s.emberCount = 0;
    s.wave = 0;
    s.light = PLAYER.maxLight;
    s.multiplier = 1;
    s.comboTimer = 0;
    s.kills = 0;
    s.shotsFired = 0;
    s.shotsHit = 0;
    s.player = createPlayer();
    s.wisps = [];
    s.embers = [];
    s.bolts = [];
    s.powerups = [];
    s.particles = [];
    s.floats = [];
    s.spawnQueue = [];
    s.dawn = 0;
    for (let i = 0; i < 7; i += 1) s.embers.push(spawnEmber(this.rng));
    this.beginWave(1);
  }

  beginWave(wave) {
    const s = this.state;
    s.wave = wave;
    const comp = waveComposition(wave);
    const queue = [];
    for (let i = 0; i < comp.drifters; i += 1) queue.push('drifter');
    for (let i = 0; i < comp.skitters; i += 1) queue.push('skitter');
    for (let i = 0; i < comp.brutes; i += 1) queue.push('brute');
    for (let i = 0; i < comp.warden; i += 1) queue.push(KIND_WARDEN);
    // Shuffle so kinds arrive mixed, not in blocks.
    for (let i = queue.length - 1; i > 0; i -= 1) {
      const j = Math.floor(this.rng() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }
    s.spawnQueue = queue;
    s.spawnTimer = 0.4;
    s.banner = wave === MAX_WAVE ? 'THE GLOOM WARDEN WAKES' : `WAVE ${wave}`;
    s.bannerTimer = 2.2;
    if (!this.shotMode) playWave();
  }

  addFloat(x, y, text, color) {
    this.state.floats.push({ x, y, text, color, age: 0, life: 1.1 });
  }

  addScore(base, x, y) {
    const s = this.state;
    const gained = Math.round(base * s.multiplier * (s.player.doubleUntil > s.time ? 2 : 1));
    s.score += gained;
    if (gained > 0) this.addFloat(x, y, `+${gained}`, '#ffe9a8');
    return gained;
  }

  bumpCombo() {
    const s = this.state;
    s.comboTimer = SCORE.comboWindowSeconds;
    s.multiplier = Math.min(SCORE.maxMultiplier, s.multiplier + SCORE.killMultiplierStep);
  }

  killWisp(index) {
    const s = this.state;
    const wisp = s.wisps[index];
    s.wisps.splice(index, 1);
    s.kills += 1;
    this.addScore(wisp.score, wisp.x, wisp.y);
    this.bumpCombo();
    spawnParticles(s.particles, wisp.x, wisp.y, wisp.color, wisp.kind === KIND_WARDEN ? 42 : 16, 260);
    spawnParticles(s.particles, wisp.x, wisp.y, '#ffffff', 6, 140, 0.4);
    const drop = maybeDrop(this.rng, wisp);
    if (drop) s.powerups.push(drop);
    const emberRolls = wisp.kind === 'brute' ? 3 : wisp.kind === KIND_WARDEN ? 6 : 1;
    for (let i = 0; i < emberRolls; i += 1) {
      if (this.rng() < wisp.emberChance) {
        s.embers.push(spawnEmber(this.rng, wisp.x + range(this.rng, -24, 24), wisp.y + range(this.rng, -24, 24)));
      }
    }
    if (!this.shotMode) playHit();
  }

  hurtPlayer(wisp) {
    const s = this.state;
    const p = s.player;
    if (p.invulnerable > 0) return;
    if (p.shield > 0) {
      p.shield -= 1;
      p.invulnerable = PLAYER.invulnerableSeconds;
      this.addFloat(p.x, p.y - 28, 'SHIELD HELD', '#7be495');
      spawnParticles(s.particles, p.x, p.y, '#7be495', 14, 200);
      return;
    }
    s.light -= wisp.lightLoss;
    s.multiplier = 1;
    s.comboTimer = 0;
    p.invulnerable = PLAYER.invulnerableSeconds;
    s.shake = 10;
    s.flash = 0.5;
    this.addFloat(p.x, p.y - 28, `-${wisp.lightLoss} LIGHT`, '#ff5d73');
    spawnParticles(s.particles, p.x, p.y, '#ff5d73', 18, 260);
    if (!this.shotMode) playHurt();
    if (s.light <= 0) {
      s.light = 0;
      this.gameOver();
    }
  }

  gameOver() {
    const s = this.state;
    s.screen = SCREEN_OVER;
    if (s.score > s.best) {
      s.best = s.score;
      saveBest(s.score);
    }
    spawnParticles(s.particles, s.player.x, s.player.y, '#ffcf5e', 60, 340, 1.2);
  }

  winGame() {
    const s = this.state;
    s.screen = SCREEN_WIN;
    s.dawn = 0;
    this.addScore(SCORE.waveClearBonus * MAX_WAVE, s.player.x, s.player.y - 40);
    if (s.score > s.best) {
      s.best = s.score;
      saveBest(s.score);
    }
    spawnParticles(s.particles, s.player.x, s.player.y, '#fff3c4', 80, 380, 1.4);
  }

  applyPowerup(powerup) {
    const s = this.state;
    const p = s.player;
    if (powerup.kind === 'sunburst') {
      let cleared = 0;
      for (let i = s.wisps.length - 1; i >= 0; i -= 1) {
        const wisp = s.wisps[i];
        spawnParticles(s.particles, wisp.x, wisp.y, '#fff3c4', 12, 220);
        this.addScore(wisp.score, wisp.x, wisp.y);
        s.wisps.splice(i, 1);
        cleared += 1;
      }
      s.kills += cleared;
      this.addFloat(p.x, p.y - 34, `SUNBURST! ${cleared} BANISHED`, '#fff3c4');
      if (!this.shotMode) playSunburst();
    } else if (powerup.kind === 'shield') {
      p.shield = Math.min(3, p.shield + 1);
      this.addFloat(p.x, p.y - 34, 'LANTERN SHIELD +1', '#7be495');
      if (!this.shotMode) playPower();
    } else {
      p.doubleUntil = s.time + 12;
      this.addFloat(p.x, p.y - 34, 'DOUBLE EMBERS 12s', '#ffb347');
      if (!this.shotMode) playPower();
    }
    spawnParticles(s.particles, powerup.x, powerup.y, '#ffe9a8', 16, 200);
  }

  // One fixed step. `input` is {mx, my, ax, ay, shoot, dash, hasMouse}.
  // Returns an event bitmask; the caller reads state.screen for the rest.
  step(dt, input) {
    const s = this.state;
    s.time += dt;
    let events = EVENT_NONE;

    // Fireflies and the garden always breathe, on every screen.
    for (const f of s.fireflies) {
      f.phase += dt * f.speed;
      f.x += Math.sin(f.phase * 0.6) * 8 * dt;
      f.y += Math.cos(f.phase * 0.8) * 6 * dt;
    }
    for (const p of s.particles) updateParticle(p, dt);
    s.particles = s.particles.filter((p) => p.age < p.life);
    for (const f of s.floats) f.age += dt;
    s.floats = s.floats.filter((f) => f.age < f.life);
    s.shake = Math.max(0, s.shake - dt * 26);
    s.flash = Math.max(0, s.flash - dt * 1.6);
    if (s.bannerTimer > 0) s.bannerTimer -= dt;

    if (s.screen === SCREEN_TITLE) {
      // Attract mode: the garden's wisps drift and the keeper idles.
      for (const wisp of s.wisps) updateWisp(wisp, dt, s.player, s.time);
      for (const ember of s.embers) updateEmber(ember, dt, s.player);
      s.player.bob += dt;
      return events;
    }
    if (s.screen === SCREEN_PAUSE) return events;
    if (s.screen === SCREEN_OVER || s.screen === SCREEN_WIN) {
      if (s.screen === SCREEN_WIN) s.dawn = Math.min(1, s.dawn + dt * 0.25);
      for (const wisp of s.wisps) updateWisp(wisp, dt, s.player, s.time);
      return events;
    }

    // ---- PLAY ----
    const p = s.player;
    p.bob += dt;
    p.cooldown = Math.max(0, p.cooldown - dt);
    p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    p.invulnerable = Math.max(0, p.invulnerable - dt);
    if (s.comboTimer > 0) {
      s.comboTimer -= dt;
      if (s.comboTimer <= 0) s.multiplier = 1;
    }

    // Lantern light always burns down; embers are the only way back up.
    s.light -= PLAYER.lightDrain * dt;
    if (s.light <= 0) {
      s.light = 0;
      this.gameOver();
      return EVENT_OVER;
    }

    // Movement: accelerate toward the input vector, friction when idle.
    if (p.dashTime > 0) {
      p.dashTime -= dt;
      p.vx = p.dashX * PLAYER.dashSpeed;
      p.vy = p.dashY * PLAYER.dashSpeed;
    } else {
      p.vx += input.mx * PLAYER.accel * dt;
      p.vy += input.my * PLAYER.accel * dt;
      const speed = Math.hypot(p.vx, p.vy);
      const max = PLAYER.speed;
      if (speed > max) {
        p.vx = (p.vx / speed) * max;
        p.vy = (p.vy / speed) * max;
      }
      if (input.mx === 0 && input.my === 0) {
        p.vx *= Math.pow(PLAYER.friction, dt * 60);
        p.vy *= Math.pow(PLAYER.friction, dt * 60);
      }
      if (input.dash && p.dashCooldown <= 0 && (input.mx !== 0 || input.my !== 0)) {
        p.dashCooldown = PLAYER.dashCooldown;
        p.dashTime = PLAYER.dashSeconds;
        p.dashX = input.mx;
        p.dashY = input.my;
        p.invulnerable = Math.max(p.invulnerable, PLAYER.dashSeconds + 0.1);
        spawnParticles(s.particles, p.x, p.y, '#ffcf5e', 10, 180, 0.4);
      }
    }
    p.x = Math.max(p.radius, Math.min(VIEW.width - p.radius, p.x + p.vx * dt));
    p.y = Math.max(70 + p.radius, Math.min(VIEW.height - p.radius, p.y + p.vy * dt));
    if (input.hasMouse || input.shoot) {
      p.facing = Math.atan2(input.ay - p.y, input.ax - p.x);
    }

    // Fire a bolt of light toward the aim point.
    if (input.shoot && p.cooldown <= 0) {
      p.cooldown = PLAYER.boltCooldown;
      s.bolts.push(spawnBolt(p, input.ax, input.ay));
      s.shotsFired += 1;
      spawnParticles(s.particles, p.x + Math.cos(p.facing) * 22, p.y + Math.sin(p.facing) * 22, '#ffe9a8', 3, 120, 0.25);
      if (!this.shotMode) playShoot();
    }

    // Spawn the wave's wisps on a timer.
    if (s.spawnQueue.length > 0) {
      s.spawnTimer -= dt;
      if (s.spawnTimer <= 0) {
        s.spawnTimer = Math.max(0.35, 1.0 - s.wave * 0.06);
        const kind = s.spawnQueue.shift();
        const at = edgeSpawn(this.rng, p);
        const wisp = spawnWisp(this.rng, kind, at.x, at.y);
        wisp.spawnAge = 0;
        s.wisps.push(wisp);
        spawnParticles(s.particles, at.x, at.y, '#8b7ff0', 8, 120, 0.5);
      }
    }

    // Wisps hunt.
    for (const wisp of s.wisps) updateWisp(wisp, dt, p, s.time);

    // Bolts fly and strike.
    for (let i = s.bolts.length - 1; i >= 0; i -= 1) {
      const bolt = s.bolts[i];
      updateBolt(bolt, dt);
      let dead = bolt.life <= 0 || bolt.x < 0 || bolt.x > VIEW.width || bolt.y < 70 || bolt.y > VIEW.height;
      if (!dead) {
        for (let j = s.wisps.length - 1; j >= 0; j -= 1) {
          const wisp = s.wisps[j];
          const d = Math.hypot(bolt.x - wisp.x, bolt.y - wisp.y);
          if (d < bolt.radius + wisp.radius) {
            wisp.hp -= bolt.damage;
            wisp.hitFlash = 0.12;
            s.shotsHit += 1;
            spawnParticles(s.particles, bolt.x, bolt.y, '#ffe9a8', 6, 160, 0.3);
            if (wisp.hp <= 0) this.killWisp(j);
            dead = true;
            break;
          }
        }
      }
      if (dead) s.bolts.splice(i, 1);
    }

    // Wisps that reach the keeper drain its light.
    for (const wisp of s.wisps) {
      const d = Math.hypot(wisp.x - p.x, wisp.y - p.y);
      if (d < wisp.radius + p.radius - 2) {
        this.hurtPlayer(wisp);
        // Shove the wisp back so one touch is one hit, not a drain.
        const push = 260;
        const nx = (wisp.x - p.x) / (d || 1);
        const ny = (wisp.y - p.y) / (d || 1);
        wisp.x += nx * push * dt * 8;
        wisp.y += ny * push * dt * 8;
        if (s.screen !== SCREEN_PLAY) return s.screen === SCREEN_OVER ? EVENT_OVER : EVENT_NONE;
      }
    }

    // Embers feed the lantern.
    for (let i = s.embers.length - 1; i >= 0; i -= 1) {
      const ember = s.embers[i];
      updateEmber(ember, dt, p);
      const d = Math.hypot(ember.x - p.x, ember.y - p.y);
      if (d < EMBER.pickupRadius + p.radius) {
        s.embers.splice(i, 1);
        s.emberCount += 1;
        s.light = Math.min(PLAYER.maxLight, s.light + PLAYER.emberLight);
        this.addScore(EMBER.score, ember.x, ember.y);
        spawnParticles(s.particles, ember.x, ember.y, '#ffb347', 8, 140, 0.4);
        if (!this.shotMode) playPickup();
      }
    }
    // A trickle of fresh embers keeps the garden lit.
    if (s.embers.length < 5 && this.rng() < dt * 0.5) {
      s.embers.push(spawnEmber(this.rng));
    }

    // Power-ups expire, or are taken.
    for (let i = s.powerups.length - 1; i >= 0; i -= 1) {
      const powerup = s.powerups[i];
      updatePowerup(powerup, dt);
      if (powerup.life <= 0) {
        s.powerups.splice(i, 1);
        continue;
      }
      const d = Math.hypot(powerup.x - p.x, powerup.y - p.y);
      if (d < powerup.radius + p.radius) {
        s.powerups.splice(i, 1);
        this.applyPowerup(powerup);
      }
    }

    // Wave cleared: bonus, breath, next wave — or the dawn.
    if (s.spawnQueue.length === 0 && s.wisps.length === 0 && s.screen === SCREEN_PLAY) {
      if (s.wave >= MAX_WAVE) {
        this.winGame();
        return EVENT_WIN;
      }
      if (s.waveClearTimer <= 0) {
        s.waveClearTimer = 2.0;
        const bonus = SCORE.waveClearBonus * s.wave;
        this.addScore(bonus, p.x, p.y - 40);
        s.light = Math.min(PLAYER.maxLight, s.light + SCORE.waveClearLight);
        this.addFloat(p.x, p.y - 60, `WAVE ${s.wave} CLEAR  +${bonus}`, '#7be495');
        events |= EVENT_WAVE_CLEAR;
      }
      s.waveClearTimer -= dt;
      if (s.waveClearTimer <= 0) {
        s.waveClearTimer = 0;
        this.beginWave(s.wave + 1);
      }
    } else {
      s.waveClearTimer = 0;
    }

    return events;
  }
}

export { STEP };
