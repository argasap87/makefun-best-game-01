// Keyboard + mouse, in canvas coordinates. The game polls this once a step;
// edge-triggered keys (pause, restart, mute, start) are consumed by main.js.
export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  const mouse = { x: 640, y: 360, down: false, clicked: false };
  let hasMouse = false;

  function toCanvas(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault();
    }
    if (!event.repeat) pressed.add(event.key.toLowerCase());
    keys.add(event.key.toLowerCase());
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.key.toLowerCase());
  });
  window.addEventListener('blur', () => {
    keys.clear();
  });
  canvas.addEventListener('mousemove', (event) => {
    const p = toCanvas(event);
    mouse.x = p.x;
    mouse.y = p.y;
    hasMouse = true;
  });
  canvas.addEventListener('mousedown', (event) => {
    const p = toCanvas(event);
    mouse.x = p.x;
    mouse.y = p.y;
    mouse.down = true;
    mouse.clicked = true;
    hasMouse = true;
  });
  window.addEventListener('mouseup', () => {
    mouse.down = false;
  });

  // Movement vector from WASD or arrows, normalised.
  function moveVector() {
    let x = 0;
    let y = 0;
    if (keys.has('a') || keys.has('arrowleft')) x -= 1;
    if (keys.has('d') || keys.has('arrowright')) x += 1;
    if (keys.has('w') || keys.has('arrowup')) y -= 1;
    if (keys.has('s') || keys.has('arrowdown')) y += 1;
    if (x !== 0 && y !== 0) {
      const len = Math.hypot(x, y);
      x /= len;
      y /= len;
    }
    return { x, y };
  }

  // The frame's control state for world.step: movement, aim point and fire.
  function frame() {
    const move = moveVector();
    const shoot = mouse.down || keys.has(' ') || mouse.clicked;
    return {
      mx: move.x,
      my: move.y,
      ax: mouse.x,
      ay: mouse.y,
      shoot,
      dash: keys.has('shift'),
      hasMouse,
    };
  }

  function consumePressed(key) {
    const hit = pressed.has(key);
    if (hit) pressed.delete(key);
    return hit;
  }

  function consumeClick() {
    const hit = mouse.clicked;
    mouse.clicked = false;
    return hit;
  }

  function endFrame() {
    pressed.clear();
    mouse.clicked = false;
  }

  return { frame, consumePressed, consumeClick, endFrame, mouse };
}
