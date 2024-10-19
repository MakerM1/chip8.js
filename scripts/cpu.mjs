class CPU {
  constructor(renderer, keyboard, speaker) {
    this.renderer = renderer;
    this.keyboard = keyboard;
    this.speaker = speaker;

    // 4KB (4096 bytes) of memory
    this.memory = new Uint8Array(4096);

    // 16 8-bit registers
    this.v = new Uint8Array(16);

    // stores memory addresses. set this to 0 since we arent storing at initialization.
    this.i = 0;

    // Timers
    this.delayTimer = 0;
    this.soundTimer = 0;

    // Program Counter. stores the currently executing address
    this.pc = 0x200;

    // dont initialize this with a size in order to avoid empty results
    // stack allows the program to temporarily leave its current execution to perform specific tasks (subroutines) and then return to exactly where it left off.
    this.stack = new Array();

    // Some instuctions require pausing
    this.paused = false;

    this.speed = 10;
  }

  loadSpritesIntoMemory() {
    // Array of hex values for each sprite Each sprite is 5 bytes
    // The technical reference provides each one of these values
    const sprites = [
      0xf0,
      0x90,
      0x90,
      0x90,
      0xf0, // 0
      0x20,
      0x60,
      0x20,
      0x20,
      0x70, // 1
      0xf0,
      0x10,
      0xf0,
      0x80,
      0xf0, // 2
      0xf0,
      0x10,
      0xf0,
      0x10,
      0xf0, // 3
      0x90,
      0x90,
      0xf0,
      0x10,
      0x10, // 4
      0xf0,
      0x80,
      0xf0,
      0x10,
      0xf0, // 5
      0xf0,
      0x80,
      0xf0,
      0x90,
      0xf0, // 6
      0xf0,
      0x10,
      0x20,
      0x40,
      0x40, // 7
      0xf0,
      0x90,
      0xf0,
      0x90,
      0xf0, // 8
      0xf0,
      0x90,
      0xf0,
      0x10,
      0xf0, // 9
      0xf0,
      0x90,
      0xf0,
      0x90,
      0x90, // A
      0xe0,
      0x90,
      0xe0,
      0x90,
      0xe0, // B
      0xf0,
      0x80,
      0x80,
      0x80,
      0xf0, // C
      0xe0,
      0x90,
      0x90,
      0x90,
      0xe0, // D
      0xf0,
      0x80,
      0xf0,
      0x80,
      0xf0, // E
      0xf0,
      0x80,
      0xf0,
      0x80,
      0x80, // F
    ];

    // According to the technical reference sprites are stored in the interpreter section of memory starting at hex 0x000
    for (let i = 0; i < sprites.length; i++) {
      this.memory[i] = sprites[i];
    }
  }

  loadPorgramIntoMemory(program) {
    for (let loc = 0; loc < program.length; loc++) {
      this.memory[0x200 + loc] = program[loc];
    }
  }

  loadRom(romName) {
    let request = new XMLHttpRequest();
    let self = this;

    // handles response received from sending (request.send()) our request
    request.onload = () => {
      // if theres content
      if (request.response) {
        // store conents of the response in an 8-bit array
        let program = new Uint8Array(request.response);

        // load rom in memory
        self.loadPorgramIntoMemory(program);
      }
    };

    // Initialaize GET request to get out ROM
    request.open("GET", "./roms/" + `${romName}_file/` + romName);

    request.responseType = "arraybuffer";

    // send the GET request
    request.send();
  }

  cycle() {
    // execution of insturctions
    // bigger the speed more instructions it will execute
    for (let i = 0; i < this.speed; i++) {
      // check if emulator is running
      if (!this.paused) {
        /* 
            each chip8 instruction is 16bits (2 bytes) long
            but our memory is made up of 8bit (1 byte) pieces so each instruction is stored across two consecutive memory locations
            we need to turn the first piece of memory to be 16bits long (by shifting it left by 8bits) to make space for the 2nd byte
            so we go from for example 0x10 to 0x1000 then we add (or bitwise OR |) the 2nd 8bit value from memory onto it (for example 0xF0) making it 0x10F0 making it a full 16bits (2 bytes) instruction that the emulator can execute 
            */
        let opcode = (this.memory[this.pc] << 8) | this.memory[this.pc + 1];
        this.executeInstruction(opcode);
      }
    }

    // update timers, play sounds and render sprites
    if (!this.paused) {
      this.updateTimers();
    }

    this.playSound();
    this.renderer.render();
  }

  updateTimers() {
    if (this.delayTimer > 0) {
      this.delayTimer -= 1;
    }

    if (this.soundTimer > 0) {
      this.soundTimer -= 1;
    }
  }

  playSound() {
    if (this.soundTimer > 0) {
      this.speaker.play(440);
    } else {
      this.speaker.stop();
    }
  }

  /* 
    In these listings, the following variables are used:

    nnn or addr - A 12-bit value, the lowest 12 bits of the instruction
    n or nibble - A 4-bit value, the lowest 4 bits of the instruction
    x - A 4-bit value, the lower 4 bits of the high byte of the instruction
    y - A 4-bit value, the upper 4 bits of the low byte of the instruction
    kk or byte - An 8-bit value, the lowest 8 bits of the instruction
  */
  executeInstruction(opcode) {
    // Increment the program counter to prepare it for the next instruction
    // Each instruction is 2 bytes long so increment it by 2
    this.pc += 2;

    /* 
    an instruction 0x5460 If we & (bitwise AND) that instruction with hex value 0x0F00 we'll end up with 0x0400. Shift that 8 bits right and we end up with 0x04 or 0x4. Same thing with y. We & the instruction with hex value 0x00F0 and get 0x0060. Shift that 4 bits right and we end up with 0x006 or 0x6.
    */

    // We only need the 2nd nibble so grab the value of the 2nd nibble
    // and shift it right 8 bits to get rid of everything but that 2nd nibble
    // example: 0x5460; x = 0x4
    let x = (opcode & 0x0f00) >> 8;

    // We only need the 3rd nibble, so grab the value of the 3rd nibble
    // and shift it right 4 bits to get rid of everything but that 3rd nibble
    // example: 0x5460; y = 0x6
    let y = (opcode & 0x00f0) >> 4;

    switch (opcode & 0xf000) {
      case 0x0000:
        switch (opcode) {
          case 0x00e0:
            // 00E0 - CLS
            // Clear the display
            this.renderer.clear();
            break;
          case 0x00ee:
            // 00EE - RET
            // makes the program jump back to where it was before the subroutine was called.
            // when program needs to do something else it jumps to it (subroutine) and when it doesnt need it anymore jumps back to where it left off
            this.pc = this.stack.pop();
            break;
        }

        break;
      case 0x1000:
        // 1nnn - JP addr
        // Set the program counter to the value stored in nnn.
        // 0xFFF grabs the value of nnn. So 0x1426 & 0xFFF will give us 0x426 and then we store that in this.pc.
        this.pc = opcode & 0xfff;
        break;
      case 0x2000:
        // 2nnn - CALL addr
        // The interpreter increments the stack pointer, then puts the current PC on the top of the stack. The PC is then set to nnn.
        this.stack.push(this.pc);
        this.pc = opcode & 0xfff;
        break;
      case 0x3000:
        // 3xkk - SE Vx, byte
        // Skip next instruction if Vx = kk.

        // The interpreter compares register Vx to kk, and if they are equal, increments the program counter by 2.
        if (this.v[x] === (opcode & 0xff)) {
          this.pc += 2;
        }
        break;
      case 0x4000:
        // 4xkk - SNE vx, byte
        // Skip next instruction if Vx != kk.
        // The interpreter compares register Vx to kk, and if they are not equal, increments the program counter by 2.
        if (this.v[x] !== (opcode & 0xff)) {
          this.pc += 2;
        }
        break;
      case 0x5000:
        // 5xy0 - SE Vx, Vy
        // Skip next instruction if Vx = Vy.
        // The interpreter compares register Vx to register Vy, and if they are equal, increments the program counter by 2.
        if (this.v[x] === this.v[y]) {
          this.pc += 2;
        }
        break;
      case 0x6000:
        // 6xkk - LD Vx, byte
        // Set Vx = kk.
        // The interpreter puts the value kk into register Vx.
        this.v[x] = opcode & 0xff;
        break;
      case 0x7000:
        // 7xkk - ADD Vx, byte
        // Set Vx = Vx + kk.
        // Adds the value kk to the value of register Vx, then stores the result in Vx.
        this.v[x] += opcode & 0xff;
        break;
      case 0x8000:
        switch (opcode & 0xf) {
          case 0x0:
            // 8xy0 - LD Vx, Vy
            // Set Vx = Vy.
            // Stores the value of register Vy in register Vx.
            this.v[x] = this.v[y];
            break;
          case 0x1:
            // 8xy1 - OR Vx, Vy
            // Set Vx = Vx OR Vy.
            // Performs a bitwise OR on the values of Vx and Vy, then stores the result in Vx. A bitwise OR compares the corrseponding bits from two values, and if either bit is 1, then the same bit in the result is also 1. Otherwise, it is 0.
            this.v[x] |= this.v[y];
            break;
          case 0x2:
            // 8xy2 - AND Vx, Vy
            // Set Vx = Vx AND Vy.
            // Performs a bitwise AND on the values of Vx and Vy, then stores the result in Vx. A bitwise AND compares the corrseponding bits from two values, and if both bits are 1, then the same bit in the result is also 1. Otherwise, it is 0.
            this.v[x] &= this.v[y];
            break;
          case 0x3:
            // 8xy3 - XOR Vx, Vy
            // Set Vx = Vx XOR Vy.
            // Performs a bitwise exclusive OR on the values of Vx and Vy, then stores the result in Vx. An exclusive OR compares the corrseponding bits from two values, and if the bits are not both the same, then the corresponding bit in the result is set to 1. Otherwise, it is 0.
            this.v[x] ^= this.v[y];
            break;
          case 0x4:
            // 8xy4 - ADD Vx, Vy
            // Set Vx = Vx + Vy, set VF = carry.
            // The values of Vx and Vy are added together. If the result is greater than 8 bits (i.e., > 255,) VF is set to 1, otherwise 0. Only the lowest 8 bits of the result are kept, and stored in Vx.
            let sum = (this.v[x] += this.v[y]);

            this.v[0xf] = 0;

            if (sum > 0xff) {
              this.v[0xf] = 1;
            }

            // this.v being a Uint8Array, any value over 8 bits automatically has the lower, rightmost, 8 bits taken and stored in the array. Therefore we don't need to do anything special with it.
            this.v[x] = sum;
            break;
          case 0x5:
            // 8xy5 - SUB Vx, Vy
            // Set Vx = Vx - Vy, set VF = NOT borrow.
            // If Vx > Vy, then VF is set to 1, otherwise 0. Then Vy is subtracted from Vx, and the results stored in Vx.
            this.v[0xf] = 0;

            if (this.v[x] > this.v[y]) {
              this.v[0xf] = 1;
            }

            // since we're using a Uint8Array, we don't have to do anything to handle underflow as it's taken care of for us. So -1 will become 255, -2 becomes 254, and so forth.
            this.v[x] -= this.v[y];
            break;
          case 0x6:
            // 8xy6 - SHR Vx {, Vy}
            // Set Vx = Vx SHR 1.
            // If the least-significant bit of Vx is 1, then VF is set to 1, otherwise 0. Then Vx is divided by 2.

            // determine the least-significant bit and set VF accordingly.
            // f Vx, in binary, is 1001, VF will be set to 1 since the least-significant bit is 1. If Vx is 1000, VF will be set to 0.
            this.v[0xf] = this.v[x] & 0x1;

            //  shifts the value in register Vx right by 1 bit, effectively dividing it by 2 and discarding the least significant bit.
            // If this.v[x] is 0b1010 (binary for 10), then this.v[x] >> 1 will result in 0b0101
            this.v[x] >>= 1;
            break;
          case 0x7:
            // 8xy7 - SUBN Vx, Vy
            // Set Vx = Vy - Vx, set VF = NOT borrow.
            // If Vy > Vx, then VF is set to 1, otherwise 0. Then Vx is subtracted from Vy, and the results stored in Vx.

            // This instruction subtracts Vx from Vy and stores the result in Vx. If Vy is larger then Vx, we need to store 1 in VF, otherwise we store 0.
            this.v[0xf] = 0;

            if (this.v[y] > this.v[x]) {
              this.v[0xf] = 1;
            }

            this.v[x] = this.v[y] - this.v[x];
            break;
          case 0xe:
            // 8xyE - SHL Vx {, Vy}
            // Set Vx = Vx SHL 1.
            // If the most-significant bit of Vx is 1, then VF is set to 1, otherwise to 0. Then Vx is multiplied by 2.

            // grabbing the most significant bit of Vx and storing that in VF
            this.v[0xf] = this.v[x] & 0x80;

            // simply multiply Vx by 2 by shifting it left 1
            // If this.v[x] is 0b0101, then this.v[x] << 1 will result in 0b1010
            this.v[x] <<= 1;
            break;
        }

        break;
      case 0x9000:
        // 9xy0 - SNE Vx, Vy
        // Skip next instruction if Vx != Vy.
        // The values of Vx and Vy are compared, and if they are not equal, the program counter is increased by 2.

        if (this.v[x] !== this.v[y]) {
          this.pc += 2;
        }
        break;
      case 0xa000:
        // Annn - LD I, addr
        // Set I = nnn.
        // The value of register I is set to nnn.

        // If the opcode is 0xA740 then (opcode & 0xFFF) will return 0x740
        this.i = opcode & 0xfff;
        break;
      case 0xb000:
        // Bnnn - JP V0, addr
        // Jump to location nnn + V0.
        // Set the program counter (this.pc) to nnn plus the value of register 0 (V0).

        this.pc = (opcode & 0xfff) + this.v[0];
        break;
      case 0xc000:
        // Cxkk - RND Vx, byte
        // Set Vx = random byte AND kk.
        // The interpreter generates a random number from 0 to 255, which is then ANDed with the value kk. The results are stored in Vx. See instruction 8xy2 for more information on AND.
        let rand = Math.floor(Math.random() * 0xff);

        // For example, if the opcode is 0xB849, then (opcode & 0xFF) would return 0x49
        this.v[x] = rand & (opcode & 0xff);
        break;
      case 0xd000:
        // Dxyn - DRW Vx, Vy, nibble
        // Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.
        // The interpreter reads n bytes from memory, starting at the address stored in I. These bytes are then displayed as sprites on screen at coordinates (Vx, Vy). Sprites are XORed onto the existing screen. If this causes any pixels to be erased, VF is set to 1, otherwise it is set to 0. If the sprite is positioned so part of it is outside the coordinates of the display, it wraps around to the opposite side of the screen.

        let width = 8;
        let height = opcode & 0xf;

        this.v[0xf] = 0;

        // going row by row through the sptie
        for (let row = 0; row < height; row++) {
          // grabbing 8-bits of memory, or a single row of a sprite, that's stored at this.i + row. The technical reference states we start at the address stored in I, or this.i in our case, when we read sprites from memory.
          let sprite = this.memory[this.i + row];

          //   going bit by bit or column by column through the sptie
          for (let col = 0; col < width; col++) {
            // if the bit (sprite) is not 0, render/erase the pixel
            if ((sprite & 0x80) > 0) {
              // if setPixel returns 1, which means pixel was erased, set vf to 1
              if (this.renderer.setPixels(this.v[x] + col, this.v[y] + row)) {
                // According to the technical reference, the x and y positions are located in Vx and Vy respectively. Add the col number to Vx and the row number to Vy, and you get the desired position to draw/erase a pixel.

                // If setPixel returns 1, we erase the pixel and set VF to 1. If it returns 0, we don't do anything, keeping the value of VF equal to 0.
                this.v[0xf] = 1;
              }
            }

            // Shift the sprite left 1. This will move the next next col/bit of the sprite into the first position.
            // Ex. 10010000 << 1 will become 0010000
            //  shifting the sprite left 1 bit allows us to go through each bit of the sprite.
            sprite <<= 1;

            // From there, we can go through another iteration of our inner for loop to determine whether or not to draw a pixel. And continuing this process till we reach the end or our sprite.
          }
        }
        break;
      case 0xe000:
        switch (opcode & 0xff) {
          case 0x9e:
            // Ex9E - SKP Vx
            // Skip next instruction if key with the value of Vx is pressed.
            // Checks the keyboard, and if the key corresponding to the value of Vx is currently in the down position, PC is increased by 2.

            if (this.keyboard.isKeyPressed(this.v[x])) {
              this.pc += 2;
            }
            break;
          case 0xa1:
            // ExA1 - SKNP Vx
            // Skip next instruction if key with the value of Vx is not pressed.
            // Checks the keyboard, and if the key corresponding to the value of Vx is currently in the up position, PC is increased by 2.
            if (!this.keyboard.isKeyPressed(this.v[x])) {
              this.pc += 2;
            }
            break;
        }

        break;
      case 0xf000:
        switch (opcode & 0xff) {
          case 0x07:
            // Fx07 - LD Vx, DT
            // Set Vx = delay timer value.
            // The value of DT is placed into Vx.

            this.v[x] = this.delayTimer;
            break;
          case 0x0a:
            // Fx0A - LD Vx, K
            // Wait for a key press, store the value of the key in Vx.
            // All execution stops until a key is pressed, then the value of that key is stored in Vx.

            this.paused = true;

            this.keyboard.onNextKeyPress = function (key) {
              this.v[x] = key;
              this.paused = false;
            }.bind(this);
            break;
          case 0x15:
            // Fx15 - LD DT, Vx
            // Set delay timer = Vx.
            // DT is set equal to the value of Vx.
            this.delayTimer = this.v[x];
            break;
          case 0x18:
            // Fx18 - LD ST, Vx
            // Set sound timer = Vx.
            // ST is set equal to the value of Vx.
            this.soundTimer = this.v[x];
            break;
          case 0x1e:
            // Fx1E - ADD I, Vx
            // Set I = I + Vx.
            // The values of I and Vx are added, and the results are stored in I.
            this.i += this.v[x];
            break;
          case 0x29:
            // Fx29 - LD F, Vx
            // Set I = location of sprite for digit Vx.
            // The value of I is set to the location for the hexadecimal sprite corresponding to the value of Vx

            this.i = this.v[x] * 5;
            break;
          case 0x33:
            // Fx33 - LD B, Vx
            // Store BCD representation of Vx in memory locations I, I+1, and I+2.
            // The interpreter takes the decimal value of Vx, and places the hundreds digit in memory at location in I, the tens digit at location I+1, and the ones digit at location I+2.

            // Get the hundreds digit and place it in I.
            this.memory[this.i] = parseInt(this.v[x] / 100);

            // Get tens digit and place it in I+1. Gets a value between 0 and 99,
            // then divides by 10 to give us a value between 0 and 9.
            this.memory[this.i] = parseInt((this.v[x] % 100) / 10);

            // Get the value of the ones (last) digit and place it in I+2.
            this.memory[this.i] = parseInt(this.v[x] % 10);
            break;
          case 0x55:
            // Fx55 - LD [I], Vx
            // Store registers V0 through Vx in memory starting at location I.
            // The interpreter copies the values of registers V0 through Vx into memory, starting at the address in I.

            for (let registerInex = 0; registerInex <= x; registerInex++) {
              this.memory[this.i + registerInex] = this.v[registerInex];
            }
            break;
          case 0x65:
            // Fx65 - LD Vx, [I]
            // Read registers V0 through Vx from memory starting at location I.
            // The interpreter reads values from memory starting at location I into registers V0 through Vx.

            for (let registerInex = 0; registerInex <= x; registerInex++) {
              this.v[registerInex] = this.memory[this.i + registerInex];
            }
            break;
        }

        break;

      default:
        throw new Error("Unknown opcode " + opcode);
    }
  }
}

export default CPU;
