import CPU from "./cpu.mjs";
import Keyboard from "./keyboard.mjs";
import Renderer from "./renderer.mjs";
import Speaker from "./speaker.mjs";

const renderer = new Renderer(10);
const keyboard = new Keyboard();
const speaker = new Speaker();
const cpu = new CPU(renderer, keyboard, speaker);

let loop;

let game = "tetris.rom";
const select = document.getElementById("gameSelect");
const controls = document.querySelector(".controls");

select.addEventListener("change", (e) => {
  game = e.target.value;
  console.log(game);
  loadControls(e.target.value);
  init();
});

function loadControls(romName) {
  let request = new XMLHttpRequest();
  request.onload = () => {
    if (request.response) {
      console.log(request.response);
      Object.entries(request.response).forEach(([key, value]) => {
        controls.innerHTML += `
        <p>
        ${key}: ${value}
        </p>
        `;
      });
      select.style.display = "none";
    }
  };

  request.open("GET", "./roms/" + `${romName}_file/` + "controls.json");

  request.responseType = "json";

  request.send();
}

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

  cpu.loadSpritesIntoMemory();
  cpu.loadRom(game);
  loop = requestAnimationFrame(step);
}

function step() {
  now = Date.now();
  elapsed = now - then;

  if (elapsed > fpsInterval) {
    cpu.cycle();
  }

  loop = requestAnimationFrame(step);
}
