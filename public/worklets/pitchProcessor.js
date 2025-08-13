class PitchProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.readIndex = 0;
    this.buffer = [];

    this.port.onmessage = (event) => {
      if (event.data === "resetReadIndex") {
        this.readIndex = 0;
      }
    };
  }

  static get parameterDescriptors() {
    return [
      {
        name: "pitchFactor",
        defaultValue: 0,
        minValue: -1200,
        maxValue: 1200,
      },
    ];
  }

  process(inputList, outputList, parameters) {
    const input = inputList[0];
    const output = outputList[0];
    if (input.length < 1) return true;
    const inChannel = input[0];
    const outChannel = output[0];
    const pitchCents = parameters.pitch[0];
    const playbackRate = Math.pow(2, pitchCents / 1200);

    for (let i = 0; i < outChannel.length; i++) {
      const idx = this.readIndex;
      const idxInt = Math.floor(idx);
      const idxFrac = idx - idxInt;

      if (idxInt + 1 < inChannel.length) {
        const s0 = inChannel[idxInt];
        const s1 = inChannel[idxInt + 1];
        outChannel[i] = s0 + (s1 - s0) * idxFrac;
      } else {
        outChannel[i] = 0;
      }

      this.readIndex += playbackRate;
    }

    this.readIndex = 0;
    return true;
  }
}

registerProcessor("pitchProcessor", PitchProcessor);

// const sourceLimit = Math.min(inputList.length, outputList.length);
// for (let inputIdx = 0; inputIdx < sourceLimit; inputIdx++) {
//   const input = inputList[inputIdx];
//   const output = outputList[inputIdx];
//   const channelCount = Math.min(input.length, output.length);
//   for (let channelIdx = 0; channelIdx < channelCount; channelIdx++) {
//     for (
//       let sampleIdx = 0;
//       sampleIdx < input[channelIdx].length;
//       sampleIdx++
//     ) {
//       output[channelIdx][sampleIdx] = input[channelIdx][sampleIdx];
//     }
//   }
// }

// return true;
