// All sound is synthesised with WebAudio — no audio files, no network. A soft
// pentatonic music box loops under play; every action has its own short voice.
// Audio starts only after the player's first gesture, and never in shot mode.
let ctx = null;
let muted = false;
let musicTimer = null;
let musicStep = 0;

const SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66];
const BASS = [130.81, 146.83, 164.81, 196.0];

function ensure() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch {
    ctx = null;
  }
  return ctx;
}

function tone(freq, seconds, type, gain, when = 0, slideTo = null) {
  if (!ctx || muted) return;
  try {
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + seconds);
    amp.gain.setValueAtTime(0, t0);
    amp.gain.linearRampToValueAtTime(gain, t0 + 0.008);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(amp).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.05);
  } catch {
    // Sound is garnish; a failure never stops the game.
  }
}

export function initAudio() {
  const ac = ensure();
  if (ac && ac.state === 'suspended') ac.resume().catch(() => {});
}

export function setMuted(value) {
  muted = value;
  if (muted) stopMusic();
  return muted;
}

export function isMuted() {
  return muted;
}

export function playShoot() {
  tone(880, 0.09, 'square', 0.05, 0, 320);
}

export function playHit() {
  tone(220, 0.12, 'triangle', 0.09, 0, 90);
}

export function playPickup() {
  tone(1046.5, 0.1, 'sine', 0.08);
  tone(1567.98, 0.14, 'sine', 0.06, 0.05);
}

export function playHurt() {
  tone(160, 0.25, 'sawtooth', 0.1, 0, 60);
}

export function playWave() {
  tone(392, 0.18, 'triangle', 0.09);
  tone(523.25, 0.18, 'triangle', 0.09, 0.12);
  tone(659.25, 0.3, 'triangle', 0.1, 0.24);
}

export function playPower() {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.16, 'sine', 0.08, i * 0.06));
}

export function playSunburst() {
  tone(1200, 0.5, 'sine', 0.1, 0, 180);
  tone(600, 0.4, 'triangle', 0.07, 0.05, 120);
}

export function playWin() {
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, 0.5, 'triangle', 0.09, i * 0.11));
}

export function playLose() {
  [392, 329.63, 261.63, 196].forEach((f, i) => tone(f, 0.45, 'sawtooth', 0.06, i * 0.16));
}

export function startMusic() {
  if (!ctx || musicTimer !== null || muted) return;
  musicTimer = window.setInterval(() => {
    if (muted || !ctx) return;
    const step = musicStep;
    musicStep += 1;
    // A slow music-box line over a low root that changes every 8 steps.
    const note = SCALE[(step * 3 + Math.floor(step / 4)) % SCALE.length];
    tone(note, 0.9, 'sine', 0.028);
    if (step % 8 === 0) tone(BASS[Math.floor(step / 8) % BASS.length], 2.2, 'sine', 0.035);
    if (step % 16 === 14) tone(SCALE[(step + 2) % SCALE.length] * 2, 0.5, 'sine', 0.018);
  }, 420);
}

export function stopMusic() {
  if (musicTimer !== null) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
}
