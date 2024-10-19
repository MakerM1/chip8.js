class Renderer {
  constructor(scale) {
    // screen size
    this.cols = 64;
    this.rows = 32;
    this.scale = scale;

    // canvas
    this.canvas = document.querySelector("canvas");
    this.ctx = this.canvas?.getContext("2d");
    this.canvas.width = this.cols * this.scale;
    this.canvas.height = this.rows * this.scale;

    // display
    // use arrays to simulate a display. then in each array 1 will be on, 0 will be off
    this.display = new Array(this.cols * this.rows);
  }

  setPixels(x, y) {
    // on chip8 if pixel is outside of the screen it must wrap around it and come from the other side
    // these if statements do that
    if (x > this.cols) {
      x -= this.cols;
    } else if (x < 0) {
      x += this.cols;
    }

    if (y > this.rows) {
      y -= this.rows;
    } else if (y < 0) {
      y += this.rows;
    }

    // calculating pixel location in the array (index) for display
    let pixeLoc = x + y * this.cols;

    // toggle values 0 to 1; 1 to 0; if it goes from 1 to 0 a pixel was earased
    this.display[pixeLoc] ^= 1;

    // if true a pixel was erased it false it was not
    return !this.display[pixeLoc];
  }

  clear() {
    // clears the display
    this.display = new Array(this.cols * this.rows);
  }

  render() {
    // Clears the display every render cycle. Typical for a render loop.
    this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Loop through array display
    for (let i = 0; i < this.cols * this.rows; i++) {
      // gets X pos of the pixel in array based on "i"
      let x = (i % this.cols) * this.scale;

      // gets Y pos of the pixel in array based on "i"
      let y = Math.floor(i / this.cols) * this.scale;

      //   if the value at this.display[i] == 1 redraw the said pixel
      if (this.display[i]) {
        // make pixel black
        this.ctx.fillStyle = "#249533";

        // Place a pixel at position (x, y) with a width and height of scale
        this.ctx?.fillRect(x, y, this.scale, this.scale);
      }
    }
  }

  //   render a few pixels for test purposes
  testRender() {
    this.setPixels(0, 0);
    this.setPixels(5, 2);
    this.setPixels(1, 3);
  }
}

export default Renderer;
