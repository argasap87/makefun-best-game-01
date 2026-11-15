// Emberkeep tuning: every number the game plays by lives here, so balance is one
// file to read and one file to change.
export const VIEW = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const MAX_WAVE = 8;

export const PLAYER = {
  radius: 16,
  speed: 310,
  accel: 2600,
  friction: 0.86,
  boltSpeed: 680,
  boltCooldown: 0.2,
  boltDamage: 1,
  boltRadius: 6,
  maxLight: 100,
  lightDrain: 1.45,
  emberLight: 7,
  hitLightLoss: 9,
  invulnerableSeconds: 0.9,
  dashCooldown: 2.4,
  dashSpeed: 900,
  dashSeconds: 0.16,
};

export const WISP = {
  drifter: { hp: 1, speed: 62, radius: 17, score: 25, lightLoss: 9, emberChance: 0.55, color: '#8b7ff0' },
  skitter: { hp: 1, speed: 138, radius: 13, score: 40, lightLoss: 7, emberChance: 0.45, color: '#c05fd6' },
  brute: { hp: 4, speed: 44, radius: 30, score: 90, lightLoss: 15, emberChance: 1, color: '#5f4fd6' },
  warden: { hp: 26, speed: 52, radius: 46, score: 500, lightLoss: 22, emberChance: 1, color: '#e04f7a' },
};

// How many of each kind a wave fields. Wave 8 is the Gloom Warden's night.
export function waveComposition(wave) {
  const drifters = 3 + wave * 2;
  const skitters = wave >= 2 ? wave : 0;
  const brutes = wave >= 4 ? Math.floor((wave - 1) / 2) : 0;
  const warden = wave === MAX_WAVE ? 1 : 0;
  return { drifters, skitters, brutes, warden };
}

export const EMBER = { radius: 9, score: 10, magnetRadius: 130, pickupRadius: 26 };
export const POWERUP = { radius: 15, dropChance: 0.1, bruteDropChance: 0.35 };

export const PALETTE = {
  skyTop: '#0a0e1c',
  skyBottom: '#141a30',
  ground: '#10182b',
  grassDark: '#16233d',
  grassLight: '#1d2f4d',
  path: '#1a2440',
  hudPanel: 'rgba(8, 12, 24, 0.72)',
  hudText: '#ffe9b0',
  hudDim: '#9fb2d8',
  title: '#ffd97a',
  accent: '#ffb347',
  ember: '#ffb347',
  emberCore: '#fff3c4',
  bolt: '#ffe9a8',
  playerGlow: '#ffcf5e',
  danger: '#ff5d73',
  ok: '#7be495',
};

export const SCORE = {
  killMultiplierStep: 0.25,
  maxMultiplier: 5,
  comboWindowSeconds: 2.5,
  waveClearBonus: 50,
  waveClearLight: 18,
};
