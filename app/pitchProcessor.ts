import { min } from "lodash-es";

declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean;
}

declare function registerProcessor(
  name: string,
  processorCtor: typeof AudioWorkletProcessor
): void;

class PitchProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  static get parameterDescriptors() {
    return [
      {
        name: "pitch",
        defaultValue: 0,
        minValue: -1200,
        maxValue: 1200,
      },
    ];
  }

  override process(
    inputList: Float32Array[][],
    outputList: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean {
    const pitch = parameters.pitch;
    const sourceLimit = Math.min(inputList.length, outputList.length);

    for (let inputIdx = 0; inputIdx < sourceLimit; inputIdx++) {
      const input = inputList[inputIdx]!;
      const output = outputList[inputIdx]!;
      const channelCount = Math.min(input.length, output.length);
      for (let channelIdx = 0; channelIdx < channelCount; channelIdx++) {
        for (
          let sampleIdx = 0;
          sampleIdx < input[channelIdx]!.length;
          sampleIdx++
        ) {
          output[channelIdx]![sampleIdx] = input[channelIdx]![sampleIdx]!;
        }
      }
    }
    
    return true;
  }
}

registerProcessor("pitchProcessor", PitchProcessor);
