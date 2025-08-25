export type Measure = {
  vNotes: string;
  m64Notes: string[]; // Number instead?
  v64Notes: string;
};

export type Sample = {
  audioBuffer: AudioBuffer;
  source?: AudioBufferSourceNode;
  fileName?: string;
  name: string;
  keyBind?: string;
  velocityNode: GainNode;
  mixer: Mixer;
};

export type Figure = {
  name: string;
  keyBind?: string;
  measureCount: number;
  patterns: Pattern[];
  mixer: Mixer;
};

export type Pattern = {
  mute: boolean;
  sample: Sample;
  measures: Measure[];
  mixer: Mixer;
};

export type Tracker = {
  bpm: number;
  tracks: Track[];
  mixer: Mixer;
};

export type Track = {
  figure?: Figure;
  currentMeasureIdx: number;
  nextMeasureIdx?: number;
  mixer: Mixer;
};

export type Mixer = {
  pitcherNode: AudioWorkletNode;
  pitchValue: number;
  pannerNode: StereoPannerNode;
  panValue: number;
  gainNode: GainNode;
  eq: Equalizer;
};

export type Equalizer = {
  filterNodes: BiquadFilterNode[];
  filterFreqs: number[];
  filterDetunes: number[];
  filterQs: number[];
  filterGains: number[];
}

export function equalizerAddFilter(audioContext: AudioContext, eq: Equalizer){
  eq.filterNodes.push(audioContext.createBiquadFilter());
  eq.filterFreqs.push(0);
  eq.filterDetunes.push(0);
  eq.filterQs.push(0);
  eq.filterGains.push(0);
}

export function createMixer(audioContext: AudioContext): Mixer {
  return {
    gainNode: audioContext.createGain(),
    panValue: 0,
    pannerNode: audioContext.createStereoPanner(),
    pitchValue: 0,
    pitcherNode: new AudioWorkletNode(
      audioContext,
      "pitch-processor"
    ),
    eq: {
      filterNodes: [audioContext.createBiquadFilter()],
      filterFreqs: [24000],
      filterDetunes: [0],
      filterQs: [0],
      filterGains: [0]
    }
  };
}

export function createSample(
  audioBuffer: AudioBuffer,
  name: string,
  audioContext: AudioContext,
  fileName?: string
): Sample {
  const sample = {
    audioBuffer: audioBuffer,
    name: name,
    fileName: fileName,
    velocityNode: audioContext.createGain(),
    mixer: createMixer(audioContext),
  };

  sample.velocityNode.connect(sample.mixer.pannerNode);

  return sample;
}

export function createMeasure(vNotes: string): Measure {
  return {
    vNotes: vNotes,
    v64Notes: convertTo64Velocity(vNotes),
    m64Notes: initialize64Melody(vNotes),
  };
}

export function createPattern(
  sample: Sample,
  measures: Measure[],
  audioContext: AudioContext
): Pattern {
  return {
    mute: false,
    sample: sample,
    measures: measures,
    mixer: createMixer(audioContext),
  };
}

export function createFigure(
  name: string,
  keyBind: string,
  measureCount: number,
  patterns: Pattern[],
  audioContext: AudioContext
): Figure {
  return {
    name: name,
    keyBind: keyBind,
    measureCount: measureCount,
    patterns: patterns,
    mixer: createMixer(audioContext),
  };
}

export function convertTo64Velocity(vNotes: string): string {
  const fLen = 64 / vNotes.length;
  let v64Notes = "";
  let fIdx = 0;

  const formatNotes = (c: string) => {
    v64Notes += c;
    for (let j = fIdx + 1; j < fLen + fIdx; j++) {
      v64Notes += "-";
    }
    fIdx += fLen;
  };

  for (let i = 0; i < vNotes.length; i++) {
    const c = vNotes.charAt(i);
    switch (c) {
      case "1":
        formatNotes(c);
        break;
      case "2":
        formatNotes(c);
        break;
      case "3":
        formatNotes(c);
        break;
      case "4":
        formatNotes(c);
        break;
      case "5":
        formatNotes(c);
        break;
      case "6":
        formatNotes(c);
        break;
      case "7":
        formatNotes(c);
        break;
      case "8":
        formatNotes(c);
        break;
      case "9":
        formatNotes(c);
        break;
      case "X":
        formatNotes(c);
        break;
      case "-":
        formatNotes(c);
        break;
      case ":":
        break;
      default:
        alert("Invalid note input (character) conversion");
        return "";
    }
  }

  return v64Notes;
}

export function initialize64Melody(vNotes: string): string[] {
  const fLen = 64 / vNotes.length;
  let m64Notes: string[] = [];
  let fIdx = 0;

  const formatNotes = (c: string) => {
    if (Number(c)) {
      m64Notes.push("0");
    } else {
      m64Notes.push(c);
    }

    for (let j = fIdx + 1; j < fLen + fIdx; j++) {
      m64Notes.push("-");
    }
    fIdx += fLen;
  };

  for (let i = 0; i < vNotes.length; i++) {
    const c = vNotes.charAt(i);
    switch (c) {
      case "1":
        formatNotes(c);
        break;
      case "2":
        formatNotes(c);
        break;
      case "3":
        formatNotes(c);
        break;
      case "4":
        formatNotes(c);
        break;
      case "5":
        formatNotes(c);
        break;
      case "6":
        formatNotes(c);
        break;
      case "7":
        formatNotes(c);
        break;
      case "8":
        formatNotes(c);
        break;
      case "9":
        formatNotes(c);
        break;
      case "X":
        formatNotes(c);
        break;
      case "-":
        formatNotes(c);
        break;
      case ":":
        break;
      default:
        alert("Invalid note input (character) conversion");
        return [];
    }
  }

  return m64Notes;
}

export function getMelodyIndex(idxC: number, vNotes: string): number {
  let idxM = 0;
  let _vNotes = "";

  for (let i = 0; i < idxC; i++) {
    const c = vNotes.charAt(i);
    if (c !== ":") idxM++;
  }

  for (let i = 0; i < vNotes.length; i++) {
    const c = vNotes.charAt(i);
    if (c !== ":") _vNotes += c;
  }

  const fLen = 64 / _vNotes.length;
  return fLen * idxM;
}

export function getCursorForVNotes(
  m: Measure,
  idxC: number,
  idxM: number
): boolean {
  const audioStore = useAudioStore();
  if (!audioStore.activeTrack) return false;

  let colonIndices: number[] = [];
  let currentNoteIdx: number = idxC;

  for (let i = 0; i < m.vNotes.length; i++) {
    if (m.vNotes[i] === ":") colonIndices.push(i);
  }

  if (colonIndices.includes(idxC)) return false;

  for (const colonIdx of colonIndices) {
    if (idxC > colonIdx) currentNoteIdx -= 1;
  }

  const vNotesClean = m.vNotes.replaceAll(":", "");
  const fLen = 64 / vNotesClean.length;
  const nextNoteIdx = currentNoteIdx + 1;

  if (audioStore.activeTrack.currentMeasureIdx !== idxM) return false;

  if (audioStore.cursor === currentNoteIdx * fLen) return true;

  if (
    audioStore.cursor < nextNoteIdx * fLen &&
    audioStore.cursor > currentNoteIdx * fLen
  )
    return true;

  return false;
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function selectAllText(e: Event) {
  const target = e.target as HTMLInputElement;
  target.select();
}
// Ignore below

// export type DragHandler = {
//     moveHandler: (e: MouseEvent) => void;
//     upHandler: (e: MouseEvent) => void;
// }
// export type Sample = {
//     fileName: string,
//     audioBuffer: AudioBuffer,
//     sampleSource: AudioBufferSourceNode,
//     analyser: AnalyserNode,
//     button: string,
//     isPlaying: boolean
// }

// export type RecordedAudio = {
//     element: HTMLAudioElement,
//     source: MediaElementAudioSourceNode,
//     analyser: AnalyserNode,
//     isPlaying: boolean
// }

// Visualisation

// <!-- Circle -->
//       <div
//         class="relative rounded-[100%] w-[300px] h-[300px] border border-black"
//         :ref="
//           (el) => {
//             circleDiv = el as HTMLDivElement;
//           }
//         "
//       >
//         <!-- Beat Notes -->
//         <div
//           v-for="(b, idxB) in beatNotes"
//           @click="selectedBeatNote = b"
//           :key="idxB"
//           class="flex absolute border border-black rounded-[100%] justify-center items-center select-none overflow-hidden bg-white"
//           :class="{}"
//           :style="{
//             left: radius
//               ? radius +
//                 radius * Math.cos(-Math.PI / 2 + angleInterval * idxB) +
//                 'px'
//               : '',
//             top: radius
//               ? radius +
//                 radius * Math.sin(-Math.PI / 2 + angleInterval * idxB) +
//                 'px'
//               : '',
//             width: beatNoteDivSize! < 120 ? beatNoteDivSize + 'px' : '20%',
//             height: beatNoteDivSize! < 120 ? beatNoteDivSize + 'px' : '20%',
//             transform: `translate(-50%, -50%)
//              rotate(${(360 / beatNotes.length) * idxB}deg)`,
//           }"
//           :id="`beatnote-${idxB}`"
//         >
//           <div
//             v-for="(a, idxA) in b.audioSamples"
//             :key="idxA"
//             class="w-[10%] h-[10%] m-2"
//             :style="{
//               backgroundColor: a.color ? a.color : '#000000',
//             }"
//           ></div>
//           <!-- {{
//             b.audioSamples
//               .map((a) => {
//                 return a.name;
//               })
//               .join(", ")
//           }} -->
//         </div>
//       </div>

// const dragStartPosition = ref<{ x: number; y: number }>();
// const canvas = ref<HTMLCanvasElement>();
// const circleDiv = ref<HTMLDivElement>();
// const dragHandlers = ref<DragHandler>();
// const angleInterval = computed(() => {
//   return (2 * Math.PI) / beatNotes.value.length;
// });
// const radius = computed(() => {
//   if (circleDiv.value) {
//     return circleDiv.value.clientHeight / 2;
//   }
// });
// const beatNoteDivSize = computed(() => {
//   if (circleDiv.value) {
//     const circumference = 2 * Math.PI * (circleDiv.value.clientHeight / 2);
//     return circumference / beatNotes.value.length;
//   }
// });
// function startDragSample(e: MouseEvent, s: Sample) {
//   // playSample(s);
//   canvas.value = document.createElement("canvas");
//   canvas.value.classList = "top-0 left-0 fixed opacity-50 pointer-events-none";
//   canvas.value.width = window.innerWidth;
//   canvas.value.height = window.innerHeight;

//   const moveHandler = (e: MouseEvent) => dragSample(e, s);
//   const upHandler = (e: MouseEvent) => dropSample(e, s);

//   window.addEventListener("mousemove", moveHandler);
//   window.addEventListener("mouseup", upHandler);
//   dragHandlers.value = { moveHandler, upHandler };

//   document.body.appendChild(canvas.value);
//   const x = e.clientX;
//   const y = e.clientY;
//   dragStartPosition.value = { x, y };
// }
// function dragSample(e: MouseEvent, s: Sample) {
//   if (canvas.value) {
//     const ctx = canvas.value.getContext("2d");
//     if (ctx) {
//       ctx.fillStyle = "blue";
//       ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
//       ctx.lineWidth = 2;
//       ctx.strokeStyle = "red";
//       ctx.beginPath();
//       if (dragStartPosition.value) {
//         ctx.moveTo(dragStartPosition.value.x, dragStartPosition.value.y);
//         ctx.lineTo(e.clientX, e.clientY);
//         ctx.stroke();
//       }
//     }
//   }
// }
// function dropSample(e: MouseEvent, s: Sample) {
//   if (canvas.value) {
//     const target = e.target as HTMLElement;
//     // beatNotes.value.forEach((b) => {
//     //   const i = beatNotes.value.indexOf(b);
//     //   if (target.id === `beatnote-${i}`) {
//     //     b.audioSamples.push(s);
//     //   }
//     // });
//     document.body.removeChild(canvas.value);
//     canvas.value = undefined;
//     if (dragHandlers.value) {
//       window.removeEventListener("mousemove", dragHandlers.value.moveHandler);
//       window.removeEventListener("mouseup", dragHandlers.value.upHandler);
//     }
//   }
// }

// function startPitch(e: KeyboardEvent) {
//   e.preventDefault();
//   const step = 100;
//   const element = e.target as HTMLInputElement;

//   const adjustPitch = () => {
//     let pitch = Number(element.value);
//     if (e.code === "ArrowUp") pitch += step;
//     if (e.code === "ArrowDown") pitch -= step;
//     element.value = String(pitch);
//     emits("changeActiveTrackPitch", pitch);
//   };

//   adjustPitch();

//   intervalIds.value.push(window.setInterval(adjustPitch, 100));
// }

// function stopPitch() {
//   for (let i = 0; i < intervalIds.value.length; i++) {
//     clearInterval(intervalIds.value[i]);
//   }
// }
