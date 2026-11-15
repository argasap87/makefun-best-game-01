# makefun-best-game-01

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/argasap87/makefun-best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/argasap87/makefun-best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Emberkeep — Lantern of the Last Dawn: a complete, original top-down arena game. You are a lantern keeper in a garden that has gone dark. Your lantern burns down every second; only embers feed it back. Hold through eight waves — the last one wakes the Gloom Warden — and dawn breaks.

## Run it

```sh
node serve.ts
# then open http://localhost:8080 (or open game/index.html directly in desktop Chrome)
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=1ae1r9cj&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>

# Emberkeep — Lantern of the Last Dawn

A complete, original top-down arena game that runs offline from static files.
You are a lantern keeper in a garden that has gone dark. Your lantern burns
down every second; only embers feed it back. Shadow wisps hunt the light.
Hold through eight waves — the last one wakes the Gloom Warden — and dawn
breaks.

## How to play

Open `game/index.html` in desktop Chrome (or run `node serve.ts` and open
http://localhost:8080).

- **WASD / Arrow keys** — move the keeper
- **Mouse** — aim the light
- **Click / Space** — shoot a bolt of light
- **Shift** — dash (briefly untouchable, 2.4 s cooldown)
- **P / Esc** — pause · **R** — restart · **M** — mute

## Rules

- **Lantern light** drains constantly. Pick up **embers** (+7 light, +score)
  or the light dies and the night ends.
- **Wisps** drain light on touch: Drifters chase, Skitters weave fast,
  Brutes are tough, and the **Gloom Warden** (wave 8) lunges in bursts.
- Bolts banish wisps. Kills drop embers and sometimes a **power-up**:
  Sunburst (banishes every wisp on screen), Lantern Shield (blocks a hit),
  Double Embers (2× score for 12 s).
- Kills chained within 2.5 s raise a **combo multiplier** up to ×5. Getting
  hit resets it.
- Clearing a wave pays a bonus and restores light. Clear wave 8 and the
  dawn breaks — you win. The best score is kept in `localStorage`.

## Sound

All sound is synthesised live with WebAudio (a music-box line, pickup
chimes, shots, hits, wave horns, win/lose phrases). No audio files, no
network. It starts on your first click or keypress.

## Shots

The screenshots in `screenshots/` are real renders of this game's own code:
`game/index.html?shot=title|play|win|end&seed=1` plays the rules forward
with an autopilot from a fixed seed, renders the scene twice and freezes
(`window.__shotReady`).

## Layout

- `game/index.html` — the page
- `game/src/config.js` — all tuning numbers and the wave table
- `game/src/random.js` — seeded generator
- `game/src/input.js` — keyboard + mouse
- `game/src/audio.js` — WebAudio synthesis
- `game/src/entities.js` — keeper, wisps, embers, bolts, power-ups, particles
- `game/src/world.js` — screens, waves, scoring, collisions, win/lose rules
- `game/src/render.js` — the night garden, HUD and every screen
- `game/src/shots.js` — deterministic screenshot scenes with an autopilot
- `game/src/main.js` — boot and the fixed-step loop
- `main.ts` — the make.fun entry program (copies `game/` + `screenshots/`,
  writes `dossier.json`)
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

## License

MIT — see `LICENSE`.
