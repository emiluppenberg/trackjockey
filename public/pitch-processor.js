class PitchProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: "pitch",
        defaultValue: 0,
        minValue: -24,
        maxValue: 24,
      },
    ];
  }

  constructor() {
    super();

    this.bufferSize = 4096;

    this.buffers = []; // buffers[ch] will store recent input samples for ch so we can read across blocks
    this.writePos = []; // writePos[ch] is where the next incoming sample for ch will be written

    this.writeAbs = 0; // counts how many input samples we've appended so far
    this.readAbs = 0.0; // global read position
    this.adjustPos = 0.0;
  }

  process(inputs, outputs, parameters) {
    if (!inputs[0] || inputs[0].length < 1) return true; // Keep processor alive when not in use

    const pitch = parameters.pitch[parameters.pitch.length - 1];
    const playbackRate = Math.pow(2, pitch / 12);

    // Initialize buffers for each channel (first time only)
    if (this.buffers.length !== inputs[0].length) {
      this.buffers = inputs[0].map(() => new Float32Array(this.bufferSize));
      this.writePos = inputs[0].map(() => 0);
    }

    this.appendCurrentSamplesBlockIntoBuffer(inputs);
    this.produceOutput(outputs, playbackRate);

    return true;
  }

  appendCurrentSamplesBlockIntoBuffer(inputs) {
    for (let ch = 0; ch < inputs[0].length; ch++) {
      const inChannel = inputs[0][ch];
      const buf = this.buffers[ch];
      let wPos = this.writePos[ch];

      for (let i = 0; i < inChannel.length; i++) {
        buf[wPos] = inChannel[i]; // Append sample into buffer
        wPos = (wPos + 1) % this.bufferSize; // Move write position forward until circling the buffer (back to 0)

        if (ch === 0) {
          this.writeAbs++;
          this.adjustReadPosition();
        } // Increment only once per sample
      }

      this.writePos[ch] = wPos; // Store position for next block of samples
    }
  }

  produceOutput(outputs, playbackRate) {
    const numChannels = outputs[0].length;
    const blockLength = outputs[0][0].length;

    for (let i = 0; i < blockLength; i++) {
      const readIdx = Math.floor(this.readAbs) % this.bufferSize; // Index of physical sample floored from absolute read position
      const nextIdx = (readIdx + 1) % this.bufferSize;
      const frac = this.readAbs - Math.floor(this.readAbs); // Fraction between absolute read position and index of physical sample

      for (let ch = 0; ch < numChannels; ch++) {
        const buf = this.buffers[ch];
        outputs[0][ch][i] = buf[readIdx] * (1 - frac) + buf[nextIdx] * frac; // Move sample from buffer to output (using linear interpolation)
      }

      this.readAbs += playbackRate; // Advance absolute read position once per frame
    }
  }

  adjustReadPosition() {
    while (this.readAbs > this.writeAbs) {
      this.readAbs -= this.bufferSize;
    }
    while (this.readAbs < this.writeAbs - this.bufferSize) {
      this.readAbs += this.bufferSize;
    }
  }
}

registerProcessor("pitch-processor", PitchProcessor);
