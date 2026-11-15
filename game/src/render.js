// Everything the player sees: the night garden, its creatures, the HUD and the
// title, pause, game-over and victory screens. One function per layer, drawn in
// order onto the game's canvas.
import { EMBER, PALETTE, PLAYER, VIEW } from './config.js';
import { SCREEN_OVER, SCREEN_PAUSE, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './world.js';

export { SCREEN_OVER, SCREEN_PAUSE, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN };

const darkCanvas = document.createElement('canvas');
darkCanvas.width = VIEW.width;
darkCanvas.height = VIEW.height;
const darkCtx = darkCanvas.getContext('2d');

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBackground(ctx, world) {
  const s = world.state;
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  sky.addColorStop(0, PALETTE.skyTop);
  sky.addColorStop(0.55, PALETTE.skyBottom);
  sky.addColorStop(1, PALETTE.ground);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  // Stars above the garden wall.
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < s.garden.length; i += 1) {
    const g = s.garden[i];
    if (g.kind !== 0) continue;
    ctx.globalAlpha = 0.25 + 0.35 * g.hue;
    ctx.fillRect(g.x, 8 + (g.y % 52), g.size * 0.4, g.size * 0.4);
  }
  ctx.globalAlpha = 1;

  // The garden floor: dark soil, tufts and a winding stone path.
  ctx.fillStyle = PALETTE.ground;
  ctx.fillRect(0, 70, VIEW.width, VIEW.height - 70);
  ctx.strokeStyle = 'rgba(120, 150, 220, 0.10)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 420);
  ctx.bezierCurveTo(320, 360, 640, 520, 960, 430);
  ctx.bezierCurveTo(1120, 390, 1220, 470, 1280, 440);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 470);
  ctx.bezierCurveTo(320, 410, 640, 570, 960, 480);
  ctx.bezierCurveTo(1120, 440, 1220, 520, 1280, 490);
  ctx.stroke();
  for (const g of s.garden) {
    if (g.kind === 0) continue;
    ctx.strokeStyle = g.kind === 1 ? PALETTE.grassDark : PALETTE.grassLight;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x - g.size * 0.5, g.y - g.size * 1.6);
    ctx.moveTo(g.x + 2, g.y);
    ctx.lineTo(g.x + g.size * 0.4, g.y - g.size * 1.8);
    ctx.stroke();
  }

  // Fireflies drift through the dark.
  for (const f of s.fireflies) {
    const glow = 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(f.phase * 2));
    ctx.fillStyle = `rgba(255, 214, 110, ${glow})`;
    ctx.beginPath();
    ctx.arc(f.x, f.y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEmber(ctx, ember) {
  const pulse = 1 + 0.18 * Math.sin(ember.age * 3);
  const r = ember.radius * pulse;
  const glow = ctx.createRadialGradient(ember.x, ember.y, 0, ember.x, ember.y, r * 3.2);
  glow.addColorStop(0, 'rgba(255, 179, 71, 0.55)');
  glow.addColorStop(1, 'rgba(255, 179, 71, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(ember.x, ember.y, r * 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.ember;
  ctx.beginPath();
  ctx.moveTo(ember.x, ember.y - r);
  ctx.lineTo(ember.x + r * 0.7, ember.y);
  ctx.lineTo(ember.x, ember.y + r);
  ctx.lineTo(ember.x - r * 0.7, ember.y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.emberCore;
  ctx.beginPath();
  ctx.arc(ember.x, ember.y, r * 0.38, 0, Math.PI * 2);
  ctx.fill();
}

function drawWisp(ctx, wisp, time) {
  const squash = 1 + 0.08 * Math.sin(time * 4 + wisp.wobble);
  const born = Math.min(1, wisp.spawnAge * 4);
  ctx.save();
  ctx.translate(wisp.x, wisp.y);
  ctx.scale(squash, 1 / squash);
  ctx.globalAlpha = born;
  // A dark, smoky body with a coloured rim and two watching eyes.
  const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, wisp.radius * 2.4);
  aura.addColorStop(0, wisp.color);
  aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.globalAlpha = born * 0.35;
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, wisp.radius * 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = born;
  const body = ctx.createRadialGradient(-wisp.radius * 0.3, -wisp.radius * 0.3, 2, 0, 0, wisp.radius * 1.25);
  body.addColorStop(0, '#2a2440');
  body.addColorStop(0.75, '#17122a');
  body.addColorStop(1, 'rgba(23, 18, 42, 0)');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(0, 0, wisp.radius * 1.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = wisp.color;
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = born * 0.85;
  ctx.beginPath();
  ctx.arc(0, 0, wisp.radius * 0.95, 0, Math.PI * 2);
  ctx.stroke();
  const eyeY = -wisp.radius * 0.15;
  const eyeGap = wisp.radius * 0.38;
  const eyeR = Math.max(2, wisp.radius * 0.14);
  ctx.fillStyle = wisp.kind === 'warden' ? '#ff5d73' : '#e8e4ff';
  ctx.beginPath();
  ctx.arc(-eyeGap, eyeY, eyeR, 0, Math.PI * 2);
  ctx.arc(eyeGap, eyeY, eyeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#120a24';
  ctx.beginPath();
  ctx.arc(-eyeGap, eyeY, eyeR * 0.45, 0, Math.PI * 2);
  ctx.arc(eyeGap, eyeY, eyeR * 0.45, 0, Math.PI * 2);
  ctx.fill();
  if (wisp.maxHp > 1) {
    ctx.globalAlpha = born;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-wisp.radius, -wisp.radius - 12, wisp.radius * 2, 5);
    ctx.fillStyle = wisp.kind === 'warden' ? '#ff5d73' : '#c05fd6';
    ctx.fillRect(-wisp.radius, -wisp.radius - 12, wisp.radius * 2 * (wisp.hp / wisp.maxHp), 5);
  }
  ctx.restore();
  if (wisp.hitFlash > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${wisp.hitFlash * 4})`;
    ctx.beginPath();
    ctx.arc(wisp.x, wisp.y, wisp.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBolt(ctx, bolt) {
  ctx.strokeStyle = PALETTE.bolt;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(bolt.x - bolt.vx * 0.03, bolt.y - bolt.vy * 0.03);
  ctx.lineTo(bolt.x, bolt.y);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(bolt.x, bolt.y, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawPowerup(ctx, powerup) {
  const bob = Math.sin(powerup.age * 3) * 3;
  const y = powerup.y + bob;
  const blink = powerup.life < 3 ? (Math.sin(powerup.age * 12) > 0 ? 1 : 0.35) : 1;
  ctx.save();
  ctx.globalAlpha = blink;
  const glow = ctx.createRadialGradient(powerup.x, y, 0, powerup.x, y, 34);
  glow.addColorStop(0, 'rgba(255, 233, 168, 0.5)');
  glow.addColorStop(1, 'rgba(255, 233, 168, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(powerup.x, y, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1d2f4d';
  ctx.strokeStyle = '#ffe9a8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(powerup.x, y, powerup.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const glyph = powerup.kind === 'sunburst' ? '☀' : powerup.kind === 'shield' ? '⛨' : '×2';
  ctx.fillText(glyph, powerup.x, y + 1);
  ctx.restore();
}

function drawPlayer(ctx, player, time) {
  const bobY = Math.sin(player.bob * 3) * 2.5;
  const y = player.y + bobY;
  const flicker = 0.9 + 0.1 * Math.sin(time * 9) + 0.05 * Math.sin(time * 23);
  const lightR = (150 + player.light * 1.7) * flicker;
  const glow = ctx.createRadialGradient(player.x, y, 0, player.x, y, lightR);
  glow.addColorStop(0, 'rgba(255, 207, 94, 0.34)');
  glow.addColorStop(0.4, 'rgba(255, 179, 71, 0.12)');
  glow.addColorStop(1, 'rgba(255, 179, 71, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(player.x, y, lightR, 0, Math.PI * 2);
  ctx.fill();

  if (player.shield > 0) {
    ctx.strokeStyle = 'rgba(123, 228, 149, 0.8)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(player.x, y, player.radius + 10 + Math.sin(time * 4) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // The lantern: a warm glass orb in a brass cage, flame inside.
  ctx.save();
  ctx.translate(player.x, y);
  if (player.invulnerable > 0 && Math.floor(time * 14) % 2 === 0) ctx.globalAlpha = 0.45;
  ctx.fillStyle = '#3a2c12';
  ctx.fillRect(-7, -player.radius - 6, 14, 5);
  ctx.fillStyle = '#8a6a2f';
  ctx.fillRect(-11, -player.radius - 2, 22, 3);
  ctx.fillRect(-11, player.radius - 1, 22, 3);
  const glass = ctx.createRadialGradient(0, -2, 1, 0, 0, player.radius);
  glass.addColorStop(0, '#fff3c4');
  glass.addColorStop(0.6, '#ffd97a');
  glass.addColorStop(1, '#e8a33d');
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();
  // Flame.
  ctx.fillStyle = '#fff8e0';
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.quadraticCurveTo(6, -1, 0, 7);
  ctx.quadraticCurveTo(-6, -1, 0, -9);
  ctx.fill();
  ctx.fillStyle = '#3a2c12';
  ctx.beginPath();
  ctx.arc(-5, -3, 1.8, 0, Math.PI * 2);
  ctx.arc(5, -3, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Aim tick.
  ctx.strokeStyle = 'rgba(255, 233, 168, 0.7)';
  ctx.lineWidth = 2;
  const ax = player.x + Math.cos(player.facing) * (player.radius + 12);
  const ay = y + Math.sin(player.facing) * (player.radius + 12);
  ctx.beginPath();
  ctx.moveTo(ax - 4, ay);
  ctx.lineTo(ax + 4, ay);
  ctx.moveTo(ax, ay - 4);
  ctx.lineTo(ax, ay + 4);
  ctx.stroke();
}

function drawParticles(ctx, particles) {
  for (const p of particles) {
    const t = 1 - p.age / p.life;
    ctx.globalAlpha = Math.max(0, t);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * t + 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFloats(ctx, floats) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const f of floats) {
    const t = f.age / f.life;
    ctx.globalAlpha = 1 - t;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y - t * 28);
  }
  ctx.globalAlpha = 1;
}

// Night falls over everything except the keeper's light.
function drawDarkness(ctx, world) {
  const s = world.state;
  const p = s.player;
  darkCtx.clearRect(0, 0, VIEW.width, VIEW.height);
  darkCtx.globalCompositeOperation = 'source-over';
  const night = s.screen === SCREEN_WIN ? 0.25 + 0.55 * (1 - s.dawn) : 0.55;
  darkCtx.fillStyle = `rgba(3, 5, 14, ${night})`;
  darkCtx.fillRect(0, 0, VIEW.width, VIEW.height);
  darkCtx.globalCompositeOperation = 'destination-out';
  const lightR = s.screen === SCREEN_TITLE ? 320 : 140 + p.light * 1.9;
  const hole = darkCtx.createRadialGradient(p.x, p.y, 10, p.x, p.y, lightR);
  hole.addColorStop(0, 'rgba(0,0,0,1)');
  hole.addColorStop(0.7, 'rgba(0,0,0,0.85)');
  hole.addColorStop(1, 'rgba(0,0,0,0)');
  darkCtx.fillStyle = hole;
  darkCtx.beginPath();
  darkCtx.arc(p.x, p.y, lightR, 0, Math.PI * 2);
  darkCtx.fill();
  for (const ember of s.embers) {
    const eh = darkCtx.createRadialGradient(ember.x, ember.y, 0, ember.x, ember.y, 46);
    eh.addColorStop(0, 'rgba(0,0,0,0.55)');
    eh.addColorStop(1, 'rgba(0,0,0,0)');
    darkCtx.fillStyle = eh;
    darkCtx.beginPath();
    darkCtx.arc(ember.x, ember.y, 46, 0, Math.PI * 2);
    darkCtx.fill();
  }
  ctx.drawImage(darkCanvas, 0, 0);
}

function drawHud(ctx, world) {
  const s = world.state;
  ctx.fillStyle = PALETTE.hudPanel;
  ctx.fillRect(0, 0, VIEW.width, 64);
  ctx.fillStyle = 'rgba(255, 217, 122, 0.25)';
  ctx.fillRect(0, 64, VIEW.width, 2);

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 26px sans-serif';
  const scoreText = s.multiplier > 1
    ? `SCORE ${s.score.toLocaleString('en-US')}  ×${s.multiplier.toFixed(2)}`
    : `SCORE ${s.score.toLocaleString('en-US')}`;
  ctx.fillText(scoreText, 20, 26);
  ctx.font = '15px sans-serif';
  ctx.fillStyle = PALETTE.hudDim;
  ctx.fillText(`BEST ${s.best.toLocaleString('en-US')}`, 20, 50);

  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`WAVE ${s.wave} / 8`, VIEW.width / 2, 22);
  ctx.font = '15px sans-serif';
  ctx.fillStyle = PALETTE.hudDim;
  ctx.fillText(`EMBERS ${s.emberCount}`, VIEW.width / 2, 48);

  // Lantern light meter, right side.
  const meterX = VIEW.width - 300;
  const meterW = 220;
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('LANTERN', meterX, 22);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(ctx, meterX, 32, meterW, 16, 8);
  ctx.fill();
  const frac = s.light / PLAYER.maxLight;
  const grad = ctx.createLinearGradient(meterX, 0, meterX + meterW, 0);
  grad.addColorStop(0, '#ff5d73');
  grad.addColorStop(0.5, '#ffb347');
  grad.addColorStop(1, '#ffe9a8');
  ctx.fillStyle = grad;
  if (frac > 0) {
    roundRect(ctx, meterX, 32, meterW * frac, 16, 8);
    ctx.fill();
  }
  ctx.fillStyle = s.light < 25 ? '#ff5d73' : PALETTE.hudDim;
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`${Math.ceil(s.light)}`, meterX + meterW + 10, 41);

  // Active power-ups, one line left of the lantern meter.
  const buffs = [];
  if (s.player.doubleUntil > s.time) buffs.push(`DOUBLE ${Math.ceil(s.player.doubleUntil - s.time)}s`);
  if (s.player.shield > 0) buffs.push(`SHIELD ×${s.player.shield}`);
  if (buffs.length > 0) {
    ctx.textAlign = 'right';
    ctx.fillStyle = s.player.doubleUntil > s.time ? '#ffb347' : '#7be495';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(buffs.join('  •  '), meterX - 12, 41);
  }

  if (s.bannerTimer > 0 && s.banner) {
    const a = Math.min(1, s.bannerTimer);
    ctx.globalAlpha = a;
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.title;
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(s.banner, VIEW.width / 2, 170);
    ctx.globalAlpha = 1;
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(159, 178, 216, 0.85)';
  ctx.font = '14px sans-serif';
  ctx.fillText('WASD / Arrows — move    Mouse — aim    Click / Space — shoot light    Shift — dash    P — pause    M — mute', VIEW.width / 2, VIEW.height - 14);
}

function drawPanel(ctx, title, lines, accent) {
  const w = 640;
  const h = 130 + lines.length * 34;
  const x = (VIEW.width - w) / 2;
  const y = (VIEW.height - h) / 2 - 20;
  ctx.fillStyle = 'rgba(6, 9, 20, 0.88)';
  roundRect(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 18);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText(title, VIEW.width / 2, y + 56);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '19px sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW.width / 2, y + 104 + i * 34);
  });
}

function drawTitle(ctx, world) {
  const s = world.state;
  ctx.fillStyle = 'rgba(3, 5, 14, 0.45)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.title;
  ctx.font = 'bold 76px Georgia, serif';
  ctx.fillText('EMBERKEEP', VIEW.width / 2, 190);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillText('Lantern of the Last Dawn', VIEW.width / 2, 232);
  ctx.font = '19px sans-serif';
  ctx.fillStyle = PALETTE.hudDim;
  ctx.fillText('The garden has gone dark. Keep your lantern lit, gather the embers,', VIEW.width / 2, 300);
  ctx.fillText('banish the shadow wisps — and hold until dawn breaks on wave 8.', VIEW.width / 2, 328);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('WASD / Arrows to move  •  Mouse to aim  •  Click or Space to shoot  •  Shift to dash', VIEW.width / 2, 392);
  ctx.fillStyle = PALETTE.ember;
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('CLICK OR PRESS ENTER TO BEGIN', VIEW.width / 2, 448);
  if (s.best > 0) {
    ctx.fillStyle = PALETTE.hudDim;
    ctx.font = '17px sans-serif';
    ctx.fillText(`Best score: ${s.best.toLocaleString('en-US')}`, VIEW.width / 2, 492);
  }
  ctx.fillStyle = 'rgba(159, 178, 216, 0.7)';
  ctx.font = '14px sans-serif';
  ctx.fillText('Embers feed your light. Wisps drain it. A dark lantern is the end.', VIEW.width / 2, 560);
}

function drawPause(ctx) {
  ctx.fillStyle = 'rgba(3, 5, 14, 0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  drawPanel(ctx, 'PAUSED', ['Press P or click to carry on', 'R restarts the night'], PALETTE.hudText);
}

function drawOver(ctx, world) {
  const s = world.state;
  const accuracy = s.shotsFired > 0 ? Math.round((s.shotsHit / s.shotsFired) * 100) : 0;
  ctx.fillStyle = 'rgba(10, 4, 10, 0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  drawPanel(
    ctx,
    'THE LIGHT WENT OUT',
    [
      `Score ${s.score.toLocaleString('en-US')}  •  Best ${s.best.toLocaleString('en-US')}`,
      `Wave ${s.wave} of 8  •  ${s.emberCount} embers gathered  •  ${s.kills} wisps banished`,
      `Shots ${accuracy}% on target`,
      '',
      'Press R or click to light the lantern again',
    ],
    PALETTE.danger,
  );
}

function drawWin(ctx, world) {
  const s = world.state;
  // Dawn washes over the garden as the win screen settles.
  const dawnGrad = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  dawnGrad.addColorStop(0, `rgba(255, 190, 110, ${0.25 * s.dawn})`);
  dawnGrad.addColorStop(1, `rgba(255, 120, 90, ${0.18 * s.dawn})`);
  ctx.fillStyle = dawnGrad;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const accuracy = s.shotsFired > 0 ? Math.round((s.shotsHit / s.shotsFired) * 100) : 0;
  drawPanel(
    ctx,
    'DAWN BREAKS',
    [
      'You kept the lantern lit through all eight waves.',
      `Score ${s.score.toLocaleString('en-US')}  •  Best ${s.best.toLocaleString('en-US')}`,
      `${s.emberCount} embers gathered  •  ${s.kills} wisps banished  •  ${accuracy}% on target`,
      '',
      'Press R or click to play again',
    ],
    PALETTE.title,
  );
}

// The whole frame: world, darkness, HUD, then the screen on top.
export function render(ctx, world) {
  const s = world.state;
  ctx.save();
  if (s.shake > 0.2) {
    ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
  }
  drawBackground(ctx, world);
  for (const ember of s.embers) drawEmber(ctx, ember);
  for (const powerup of s.powerups) drawPowerup(ctx, powerup);
  for (const wisp of s.wisps) drawWisp(ctx, wisp, s.time);
  for (const bolt of s.bolts) drawBolt(ctx, bolt);
  drawPlayer(ctx, s.player, s.time);
  drawParticles(ctx, s.particles);
  drawFloats(ctx, s.floats);
  if (s.flash > 0) {
    ctx.fillStyle = `rgba(255, 60, 80, ${s.flash * 0.25})`;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }
  drawDarkness(ctx, world);
  drawHud(ctx, world);
  if (s.screen === SCREEN_TITLE) drawTitle(ctx, world);
  else if (s.screen === SCREEN_PAUSE) drawPause(ctx);
  else if (s.screen === SCREEN_OVER) drawOver(ctx, world);
  else if (s.screen === SCREEN_WIN) drawWin(ctx, world);
  ctx.restore();
}
