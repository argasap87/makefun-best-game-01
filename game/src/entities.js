// The things that live in the garden: the lantern keeper, shadow wisps, embers,
// light bolts, power-ups and particles. Each factory makes a plain object; each
// update moves one kind for one fixed step. World owns the lists and the rules.
import { EMBER, PLAYER, POWERUP, VIEW, WISP } from './config.js';
import { chance, pick, range } from './random.js';

export const KIND_DRIFTER = 'drifter';
export const KIND_SKITTER = 'skitter';
export const KIND_BRUTE = 'brute';
export const KIND_WARDEN = 'warden';

export function createPlayer() {
  return {
    x: VIEW.width / 2,
    y: VIEW.height / 2,
    vx: 0,
    vy: 0,
    radius: PLAYER.radius,
    light: PLAYER.maxLight,
    cooldown: 0,
    dashCooldown: 0,
    dashTime: 0,
    dashX: 0,
    dashY: 0,
    invulnerable: 0,
    shield: 0,
    doubleUntil: 0,
    facing: -Math.PI / 2,
    bob: 0,
  };
}

export function spawnWisp(rng, kind, x, y) {
  const spec = WISP[kind];
  const angle = range(rng, 0, Math.PI * 2);
  return {
    kind,
    x: x !== undefined ? x : range(rng, 60, VIEW.width - 60),
    y: y !== undefined ? y : range(rng, 90, VIEW.height - 60),
    vx: Math.cos(angle) * spec.speed,
    vy: Math.sin(angle) * spec.speed,
    hp: spec.hp,
    maxHp: spec.hp,
    radius: spec.radius,
    speed: spec.speed,
    score: spec.score,
    lightLoss: spec.lightLoss,
    emberChance: spec.emberChance,
    color: spec.color,
    wobble: range(rng, 0, Math.PI * 2),
    wobbleSpeed: range(rng, 1.5, 3.5),
    hitFlash: 0,
    spawnAge: 0,
  };
}

export function spawnEmber(rng, x, y) {
  return {
    x: x !== undefined ? x : range(rng, 40, VIEW.width - 40),
    y: y !== undefined ? y : range(rng, 90, VIEW.height - 40),
    vx: 0,
    vy: 0,
    radius: EMBER.radius,
    age: range(rng, 0, Math.PI * 2),
    drift: range(rng, 0.4, 1),
  };
}

export function spawnPowerup(rng, x, y) {
  return {
    kind: pick(rng, ['sunburst', 'shield', 'double']),
    x,
    y,
    radius: POWERUP.radius,
    age: 0,
    life: 14,
  };
}

export function spawnBolt(player, ax, ay) {
  const angle = Math.atan2(ay - player.y, ax - player.x);
  return {
    x: player.x + Math.cos(angle) * (player.radius + 6),
    y: player.y + Math.sin(angle) * (player.radius + 6),
    vx: Math.cos(angle) * PLAYER.boltSpeed,
    vy: Math.sin(angle) * PLAYER.boltSpeed,
    radius: PLAYER.boltRadius,
    damage: PLAYER.boltDamage,
    life: 1.1,
  };
}

export function spawnParticles(list, x, y, color, count, speed, life = 0.6) {
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const s = speed * (0.4 + Math.random() * 0.8);
    list.push({
      x,
      y,
      vx: Math.cos(angle) * s,
      vy: Math.sin(angle) * s,
      radius: 1.5 + Math.random() * 2.5,
      color,
      life: life * (0.6 + Math.random() * 0.7),
      age: 0,
    });
  }
}

// A wisp chases the player with its own gait: drifters home straight in, skitters
// weave, brutes lumber, the Warden lunges in bursts.
export function updateWisp(wisp, dt, player, time) {
  wisp.spawnAge += dt;
  wisp.hitFlash = Math.max(0, wisp.hitFlash - dt);
  const dx = player.x - wisp.x;
  const dy = player.y - wisp.y;
  const dist = Math.hypot(dx, dy) || 1;
  let steer = 1;
  if (wisp.kind === KIND_SKITTER) {
    const weave = Math.sin(time * wisp.wobbleSpeed + wisp.wobble) * 0.9;
    const px = -dy / dist;
    const py = dx / dist;
    wisp.vx = (dx / dist + px * weave) * wisp.speed;
    wisp.vy = (dy / dist + py * weave) * wisp.speed;
  } else if (wisp.kind === KIND_WARDEN) {
    const burst = 0.55 + 0.45 * Math.sin(time * 1.4 + wisp.wobble);
    steer = burst;
    wisp.vx = (dx / dist) * wisp.speed * steer * 2.2;
    wisp.vy = (dy / dist) * wisp.speed * steer * 2.2;
  } else {
    wisp.vx = (dx / dist) * wisp.speed;
    wisp.vy = (dy / dist) * wisp.speed;
  }
  wisp.x += wisp.vx * dt;
  wisp.y += wisp.vy * dt;
  wisp.x = Math.max(wisp.radius, Math.min(VIEW.width - wisp.radius, wisp.x));
  wisp.y = Math.max(70 + wisp.radius, Math.min(VIEW.height - wisp.radius, wisp.y));
}

// Embers drift gently and slide toward the keeper when close (magnetism).
export function updateEmber(ember, dt, player) {
  ember.age += dt;
  const dx = player.x - ember.x;
  const dy = player.y - ember.y;
  const dist = Math.hypot(dx, dy) || 1;
  if (dist < EMBER.magnetRadius) {
    const pull = (1 - dist / EMBER.magnetRadius) * 420;
    ember.vx += (dx / dist) * pull * dt;
    ember.vy += (dy / dist) * pull * dt;
  }
  ember.vx *= 0.92;
  ember.vy *= 0.92;
  ember.x += ember.vx * dt + Math.sin(ember.age * 1.3) * 6 * dt;
  ember.y += ember.vy * dt + Math.cos(ember.age * 1.1) * 6 * dt;
}

export function updateBolt(bolt, dt) {
  bolt.x += bolt.vx * dt;
  bolt.y += bolt.vy * dt;
  bolt.life -= dt;
}

export function updateParticle(p, dt) {
  p.age += dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.vx *= 0.94;
  p.vy *= 0.94;
}

export function updatePowerup(powerup, dt) {
  powerup.age += dt;
  powerup.life -= dt;
}

// Where a wisp may appear: just inside the garden's edge, away from the keeper.
export function edgeSpawn(rng, player) {
  for (let tries = 0; tries < 12; tries += 1) {
    const side = Math.floor(rng() * 4);
    let x;
    let y;
    if (side === 0) { x = range(rng, 40, VIEW.width - 40); y = 80; }
    else if (side === 1) { x = range(rng, 40, VIEW.width - 40); y = VIEW.height - 30; }
    else if (side === 2) { x = 40; y = range(rng, 100, VIEW.height - 30); }
    else { x = VIEW.width - 40; y = range(rng, 100, VIEW.height - 30); }
    if (Math.hypot(x - player.x, y - player.y) > 260) return { x, y };
  }
  return { x: 60, y: 100 };
}

export function maybeDrop(rng, wisp) {
  if (chance(rng, wisp.kind === KIND_BRUTE || wisp.kind === KIND_WARDEN ? POWERUP.bruteDropChance : POWERUP.dropChance)) {
    return spawnPowerup(rng, wisp.x, wisp.y);
  }
  return null;
}
