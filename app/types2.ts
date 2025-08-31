export type Measure = {
  notes: string;
  pitch64: Note[];
  velocity64: Note[];
  sourceNodes: AudioBufferSourceNode[];
};

export type Note = {
  value: number;
  index: number;
}

export type Sample = {
  audioBuffer: AudioBuffer;
  fileName?: string;
  name: string;
  keyBind?: string;
};

export type Figure = {
  id: number;
  name: string;
  measureCount: number;
  keyBind?: string;
  patterns: Pattern[];
};

export type Pattern = {
  mute: boolean;
  sample: Sample;
  measures: Measure[];
  velocityNode: GainNode;
};

export type Tracker = {
  bpm: number;
  tracks: Track[];
  master: Mixer;
};

export type Track = {
  figure?: Figure;
  nextFigure?: Figure;
  currentMeasureIdx: number;
  nextMeasureIdxs: number[];
  mixer: Mixer;
};

export type Mixer = {
  pitcherNode: AudioWorkletNode;
  pitch: number;
  pannerNode: StereoPannerNode;
  gainNode: GainNode;
  filterNodes: BiquadFilterNode[];
  compressorNode: DynamicsCompressorNode;
};

export function cloneFigure(f: Figure, audioContext: AudioContext): Figure {
  return {
    ...f,
    patterns: f.patterns.map((p) => clonePattern(p, audioContext)),
  };
}

export function clonePattern(p: Pattern, audioContext: AudioContext): Pattern {
  return {
    ...p,
    sample: cloneSample(p.sample, audioContext),
    measures: p.measures.map((m) => cloneMeasure(m, p.sample, audioContext)),
    velocityNode: audioContext.createGain()
  };
}

export function cloneMeasure(
  m: Measure,
  s: Sample,
  audioContext: AudioContext
) {
  return {
    ...m,
    sourceNodes: m.sourceNodes.map((sn) => {
    const newSn = audioContext.createBufferSource();
    newSn.buffer = cloneAudioBuffer(s.audioBuffer, audioContext);
    return newSn;
  })
  };
}

export function cloneSample(s: Sample, audioContext: AudioContext) {
  return {
    ...s,
    audioBuffer: cloneAudioBuffer(s.audioBuffer, audioContext),
    velocityNode: audioContext.createGain(),
  };
}

export function cloneAudioBuffer(
  audioBuffer: AudioBuffer,
  audioContext: AudioContext
): AudioBuffer {
  const clone = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
    clone.copyToChannel(audioBuffer.getChannelData(i), i);
  }

  return clone;
}

export function createMixer(audioContext: AudioContext): Mixer {
  const compressorNode = audioContext.createDynamicsCompressor();
  compressorNode.attack.value = 0.05;
  compressorNode.knee.value = 0;
  compressorNode.ratio.value = 1;
  compressorNode.threshold.value = 0;

  return {
    gainNode: audioContext.createGain(),
    pannerNode: audioContext.createStereoPanner(),
    pitch: 0,
    pitcherNode: new AudioWorkletNode(audioContext, "pitch-processor"),
    filterNodes: [],
    compressorNode: compressorNode,
  };
}

export function createSample(
  audioBuffer: AudioBuffer,
  name: string,
  fileName?: string
): Sample {
  return {
    audioBuffer: audioBuffer,
    name: name,
    fileName: fileName,
  };
}

export function createMeasure(notes: string): Measure {
  return {
    notes: notes,
    velocity64: initializeNotes64(notes),
    pitch64: initializeNotes64(notes),
    sourceNodes: []
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
    velocityNode: audioContext.createGain()
  };
}

export function createFigure(
  id: number,
  name: string,
  keyBind: string,
  patterns: Pattern[]
): Figure {
  return {
    id: id,
    name: name,
    measureCount: 0,
    keyBind: keyBind,
    patterns: patterns,
  };
}

export function initializeNotes64(notes: string): Note[] {
  const _notes = notes.replaceAll(':', '');
  const len = _notes.length;
  const step = 64 / len;
  let idx = 0;
  let notes64: Note[] = [];

  for (let i = 0; i < _notes.length; i++) {
    const c = _notes.charAt(i);

    if (!isNaN(Number(c))) {
      notes64.push({value: Number(c), index: idx});
    };

    idx += step;
  }

  return notes64;
}

export function getPitchIndex(idxC: number, m: Measure): Note {
  let idxP = 0;
  
  for (let i = 0; i < idxC; i++){
    if (m.notes[i] !== ':') idxP++;
  }
  
  const _notes = m.notes.replaceAll(':', '');

  const len = _notes.length;
  const step = 64 / len;
  return m.pitch64[idxP * step]!;
}

export function getMelodyIndex(idxC: number, notes: string): number {
  let idxM = 0;
  let _notes = "";

  for (let i = 0; i < idxC; i++) {
    const c = notes.charAt(i);
    if (c !== ":") idxM++;
  }

  for (let i = 0; i < notes.length; i++) {
    const c = notes.charAt(i);
    if (c !== ":") _notes += c;
  }

  const fLen = 64 / _notes.length;
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

  for (let i = 0; i < m.notes.length; i++) {
    if (m.notes[i] === ":") colonIndices.push(i);
  }

  if (colonIndices.includes(idxC)) return false;

  for (const colonIdx of colonIndices) {
    if (idxC > colonIdx) currentNoteIdx -= 1;
  }

  const vNotesClean = m.notes.replaceAll(":", "");
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

export function hzToMel(f: number): number {
  return 2595 * Math.log10(1 + f / 700);
}

export function melToX(f: number, w: number): number {
  const fMax = 24000;
  const mel = hzToMel(f);
  const melMax = hzToMel(fMax);
  return (mel / melMax) * w;
}

export function melToHz(m: number): number {
  return 700 * (Math.pow(10, m / 2595) - 1);
}

export function xToHz(x: number, w: number): number {
  const fMax = 24000;
  const melMax = hzToMel(fMax);
  const mel = (x / w) * melMax;
  return melToHz(mel);
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
