class Speaker {
  constructor() {
    const audioContext = window.AudioContext || window.webkitAudioContext;

    this.audioCtx = new AudioContext();

    // Gain will let us control the volume
    this.gain = this.audioCtx.createGain();
    this.finish = this.audioCtx.destination;

    // connect the Gain to audio context
    this.gain.connect(this.finish);
  }

  muteAudio() {
    this.gain.setValueAtTime(0, this.audioCtx.currentTime);
  }

  unmuteAudio() {
    this.gain.setValueAtTime(1, this.audioCtx.currentTime);
  }

  play(frequency) {
    if (this.audioCtx && !this.oscillator) {
      this.oscillator = this.audioCtx.createOscillator();

      // set the frequency
      this.oscillator.frequency.setValueAtTime(
        frequency || 440,
        this.audioCtx.currentTime
      );

      // square wave
      this.oscillator.type = "square";

      // connect the gain and start the audio
      this.oscillator.connect(this.gain);
      this.oscillator.start();
    }
  }

  stop() {
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();
      this.oscillator = null;
    }
  }
}

export default Speaker;
