export type Sample = {
    audioBuffer: AudioBuffer,
    source?: AudioBufferSourceNode,
    name: string,
    keyBind?: string
}

export type Figure = {
    name: string,
    color: string,
    keyBind?: string,
    measureCount: number,
    tempo: number,
    patterns: Pattern[]
}

export type Pattern = {
    mute: boolean,
    sample: Sample,
    measures: Measure[]
}

export type Measure = {
    index: number,
    rNotes: string,
    mNotes: string[],
    fNotes: string
}

export type Tracker = {
    bpm: number,
    tracks: Track[]
}

export type Track = {
    figure?: Figure,
    channel: ChannelMergerNode,
    pitchProcessor: AudioWorkletNode,
    pitch: number
}

export type DragHandler = {
    moveHandler: (e: MouseEvent) => void;
    upHandler: (e: MouseEvent) => void;
}

export async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export function isFigure(sound: Figure | Sample): sound is Figure{
    return (sound as Figure).measureCount !== undefined;
}
export function isSample(sound: Sample | Figure): sound is Sample{
    return (sound as Sample).audioBuffer !== undefined;
}
export function selectAllText(e: Event) {
  const target = e.target as HTMLInputElement;
  target.select();
}
// Ignore below

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