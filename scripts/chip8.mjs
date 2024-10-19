import Keyboard from "./keyboard.mjs";
import Renderer from "./renderer.mjs";
import Speaker from "./speaker.mjs";

const renderer = new Renderer(10);
const keyboard = new Keyboard();
const speaker = new Speaker();

let loop;

let fps = 60,
  fpsInterval,
  startTime,
  now,
  then,
  elapsed;

function init() {
  fpsInterval = 1000 / fps;
  then = Date.now();
  startTime = then;

  // TESTING CODE. REMOVE WHEN DONE TESTING.
  renderer.testRender();
  renderer.render();
  // END TESTING CODE

  loop = requestAnimationFrame(step);
}

function step() {
  now = Date.now();
  elapsed = now - then;

  if (elapsed > fpsInterval) {
    // Cycle the CPU. We'll come back to this later and fill it out.
  }

  loop = requestAnimationFrame(step);
}

init();
