export type AddSample = {
    file?: File,
    name?: string,
    color: string 
}

export type Sample = {
    audioBuffer: AudioBuffer,
    source?: AudioBufferSourceNode,
    name: string,
    color: string
}

export type Phrase = {
    name: string,
    measureCount: number,
    tempo: number,
    patterns: Pattern[]
}

export type Pattern = {
    sample: Sample,
    measures: Measure[]
}

export type Measure = {
    subdivision: number,
    notes: string
}

export type DragHandler = {
    moveHandler: (e: MouseEvent) => void;
    upHandler: (e: MouseEvent) => void;
}

export async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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