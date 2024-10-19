class Keyboard {
  constructor() {
    // chip 8 uses 16-key hex keypad
    // map each key to modern keyboard keys
    this.KEYMAP = {
      49: 0x1, // 1(hex) - 1(keyoard)
      50: 0x2, // 2 - 2
      51: 0x3, // 3 - 3
      52: 0xc, // c - 4
      81: 0x4, // 4 - Q
      87: 0x5, // 5 - W
      69: 0x6, // 6 - E
      82: 0xd, // D - R
      65: 0x7, // 7 - A
      83: 0x8, // 8 - S
      68: 0x9, // 9 - D
      70: 0xe, // E - F
      90: 0xa, // A - Z
      88: 0x0, // 0 - X
      67: 0xb, // B - C
      86: 0xf, // F - V
    };

    this.keyPressed = [];

    // Some Chip-8 instructions require waiting for the next keypress. Initialize this function elsewhere when needed.
    this.onNextKeyPress = null;

    window.addEventListener("keydown", this.onKeyDown.bind(this), false);
    window.addEventListener("keyup", this.onKeyUp.bind(this), false);
  }

  isKeyPressed(keyCode) {
    return this.keyPressed[keyCode];
  }

  onKeyDown(event) {
    let key = this.KEYMAP[event.which];
    this.keyPressed[key] = true;

    // Make sure onNextKeyPress is initialized and the pressed key is actually mapped to a Chip-8 key
    if (this.onNextKeyPress !== null && key) {
      this.onNextKeyPress(parseInt(key));
      this.onNextKeyPress = null;
    }
  }

  onKeyUp(event) {
    let key = this.KEYMAP[event.which];
    this.keyPressed[key] = false;
  }
}

export default Keyboard;
