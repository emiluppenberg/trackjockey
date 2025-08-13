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
    
    this.port.onmessage = (event) => {
      if (event.data === "resetReadIndex") {
        this.readIndex = 0;
      }
    };
    
    this.readPos = [];
  }
  
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || input.length === 0) {
      return true;
    }

    const semitones = parameters.pitch[0];
    const playbackRate = Math.pow(2, semitones / 12);

    for (let ch = 0; ch < output.length; ch++) {
      const inChannel = input[ch];
      const outChannel = output[ch];
      const inLen = inChannel.length;

      if (!inChannel) continue;

      // Initialize read position for this channel if needed
      if (this.readPos[ch] === undefined) {
        this.readPos[ch] = 0;
      }

      let pos = this.readPos[ch];

      for (let i = 0; i < outChannel.length; i++) {
        const idx0 = Math.floor(pos);
        const idx1 = (idx0 + 1) % inLen;
        const frac = pos - idx0;

        const s0 = inChannel[idx0];
        const s1 = inChannel[idx1];
        outChannel[i] = s0 + (s1 - s0) * frac; // linear interpolation

        pos += playbackRate;

        // Wrap around the *current block*
        if (pos >= inLen) {
          pos -= inLen;
        }
      }

      // Store updated position for continuity next process call
      this.readPos[ch] = pos;
    }

    return true;
  }
}

registerProcessor("pitchProcessor", PitchProcessor);