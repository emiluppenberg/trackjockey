<script setup lang="ts">
// TODO Guitartab style beat editor
import type {
  AddSample,
  Sample,
  Phrase,
  Pattern,
  Measure,
  DragHandler,
} from "~/types";
import { sleep } from "~/types";
const audioContext = ref<AudioContext>();
const samples = ref<Sample[]>([]);
const dragStartPosition = ref<{ x: number; y: number }>();
const canvas = ref<HTMLCanvasElement>();
const isPlaying = ref<boolean>(false);
const newSample = ref<AddSample>({ color: "#000000" });

const phrases = ref<Phrase[]>([]);
const selectedPhrase = ref<Phrase>();

const circleDiv = ref<HTMLDivElement>();
const dragHandlers = ref<DragHandler>();

async function addSample() {
  const newFile = (
    document.getElementById("newsample-file") as HTMLInputElement
  ).files?.item(0);

  if (newFile && newSample.value.color) {
    if (audioContext.value) {
      const audioBuffer = await audioContext.value.decodeAudioData(
        await newFile.arrayBuffer()
      );
      samples.value.push({
        audioBuffer: audioBuffer,
        name: newSample.value.name ? newSample.value.name : newFile.name,
        color: newSample.value.color,
      });
    }
  }
}

function addPattern() {
  if (selectedPhrase.value) {
    if (samples.value[0]) {
      if (selectedPhrase.value.measureCount > 0) {
        const measures: Measure[] = Array.from(
          { length: selectedPhrase.value.measureCount },
          () => ({
            subdivision: 16,
            notes: "",
          })
        );

        selectedPhrase.value.patterns.push({
          sample: samples.value[0],
          measures: measures,
        });
      }
    }
  }
}

function inputMeasureNotation(e: Event, m: Measure) {
  const value = (e.target as HTMLInputElement).value.toUpperCase();
  let notes: string = "";
  for (let i = 0; i < value.length; i++) {
    const c = value.charAt(i);
    switch (c) {
      case "X":
        notes += c;
        break;
      case "*":
        notes += c;
        break;
      case "-":
        notes += c;
        break;
      case "|":
        break;
      default:
        alert("Invalid note input (character) inputmeasurenotation");
        return;
    }
  }
  if (notes.length === m.subdivision) {
    m.notes = convertTo64Subdivision(notes);
    console.log("success", m.notes);
  } else {
    alert("Invalid note input (length)");
  }
}

function convertTo64Subdivision(notes: string): string {
  const fLen = 64 / notes.length;
  let fNotes = "";
  let fIdx = 0;

  const formatNotes = (c: string) => {
    fNotes += c;
    for (let j = fIdx + 1; j < fLen + fIdx; j++) {
      fNotes += "-";
    }
    fIdx += fLen;
  };

  for (let i = 0; i < notes.length; i++) {
    const c = notes.charAt(i);
    switch (c) {
      case "X":
        formatNotes(c);
        break;
      case "*":
        formatNotes(c);
        break;
      case "-":
        formatNotes(c);
        break;
      default:
        console.log("invalid");
        alert("Invalid note input (character) conversion");
        return "";
    }
  }
  console.log(fNotes, fNotes.length);
  return fNotes;
}

async function playSelectedPhrase() {
  if (selectedPhrase.value) {
    const noteLength = // Note length in milliseconds
      (1 / (64 / 4)) * // One quarter note (Measures always noted as 64/4)
      (60 / selectedPhrase.value.tempo) * // BPM (Quarter notes/Minute)
      1000; // milliseconds

    isPlaying.value = true;

    while (isPlaying.value === true) {
      for (let i = 0; i < selectedPhrase.value.measureCount; i++) {
        for (let j = 0; j < 64; j++) {
          for (const p of selectedPhrase.value.patterns) {
            const c = p.measures[i]?.notes[j];
            switch (c) {
              case "X":
                playSample(p.sample);
                break;
              case "*":
                stopSample(p.sample);
                break;
              default:
                break;
            }
          }
          await sleep(noteLength);
        }
      }
    }
  }
}

function changePhraseTempo(e: Event) {
  if (selectedPhrase.value) {
    const value = (e.target as HTMLInputElement).value;
    if (Number(value)) {
      selectedPhrase.value.tempo = Number(value);
    } else if (value === "") {
      return;
    } else if (!Number(value)) {
      alert("Tempo must be a number");
    }
  }
}

function changePhraseMeasures(e: Event) {
  if (selectedPhrase.value) {
    const value = (e.target as HTMLInputElement).value;
    if (Number(value)) {
      for (const p of selectedPhrase.value.patterns){
        if (p.measures.length > Number(value)){
          
        }
      }
      selectedPhrase.value.measureCount = Number(value);
    } else if (value === "") {
      return;
    } else if (!Number(value)) {
      alert("Measures must be a number");
    }
  }
}

async function loadSamples() {
  if (audioContext.value) {
    const hihat = await fetch(
      new URL("~/assets/HH_AcardeBullet11.wav/", import.meta.url).href
    )
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => audioContext.value!.decodeAudioData(arrayBuffer)!);

    const kick = await fetch(
      new URL("~/assets/Tom_BleepBullet3.wav/", import.meta.url).href
    )
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => audioContext.value!.decodeAudioData(arrayBuffer)!);

    const snare = await fetch(
      new URL("~/assets/SD_KastleBullet6.wav/", import.meta.url).href
    )
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => audioContext.value!.decodeAudioData(arrayBuffer)!);

    samples.value.push({ audioBuffer: kick, name: "kick", color: "#350EFB" });
    samples.value.push({ audioBuffer: hihat, name: "hihat", color: "#0EFB12" });
    samples.value.push({ audioBuffer: snare, name: "snare", color: "#E60A0A" });
  }
}
async function playSample(s: Sample) {
  if (audioContext.value) {
    s.source = audioContext.value.createBufferSource();
    s.source.buffer = s.audioBuffer;
    s.source.connect(audioContext.value.destination);
    s.source.start();
  }
}
async function stopSample(s: Sample) {
  if (audioContext.value) {
    if (s.source) {
      s.source.stop();
      s.source = undefined;
    }
  }
}

function startDragSample(e: MouseEvent, s: Sample) {
  playSample(s);
  canvas.value = document.createElement("canvas");
  canvas.value.classList = "top-0 left-0 fixed opacity-50 pointer-events-none";
  canvas.value.width = window.innerWidth;
  canvas.value.height = window.innerHeight;

  const moveHandler = (e: MouseEvent) => dragSample(e, s);
  const upHandler = (e: MouseEvent) => dropSample(e, s);

  window.addEventListener("mousemove", moveHandler);
  window.addEventListener("mouseup", upHandler);
  dragHandlers.value = { moveHandler, upHandler };

  document.body.appendChild(canvas.value);
  const x = e.clientX;
  const y = e.clientY;
  dragStartPosition.value = { x, y };
}
function dragSample(e: MouseEvent, s: Sample) {
  if (canvas.value) {
    const ctx = canvas.value.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "blue";
      ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "red";
      ctx.beginPath();
      if (dragStartPosition.value) {
        ctx.moveTo(dragStartPosition.value.x, dragStartPosition.value.y);
        ctx.lineTo(e.clientX, e.clientY);
        ctx.stroke();
      }
    }
  }
}
function dropSample(e: MouseEvent, s: Sample) {
  // if (canvas.value) {
  //   const target = e.target as HTMLElement;
  //   beatNotes.value.forEach((b) => {
  //     const i = beatNotes.value.indexOf(b);
  //     if (target.id === `beatnote-${i}`) {
  //       b.audioSamples.push(s);
  //     }
  //   });
  //   document.body.removeChild(canvas.value);
  //   canvas.value = undefined;
  //   if (dragHandlers.value) {
  //     window.removeEventListener("mousemove", dragHandlers.value.moveHandler);
  //     window.removeEventListener("mouseup", dragHandlers.value.upHandler);
  //   }
  // }
}

onMounted(() => {
  audioContext.value = new AudioContext();

  phrases.value.push({ name: "", measureCount: 0, tempo: 120, patterns: [] });
  selectedPhrase.value = phrases.value[0];
});
</script>

<template>
  <div class="flex w-full h-screen">
    <!-- D&D -->
    <div class="flex flex-col w-[75%] h-full border items-center">
      <!-- Phrase menu -->
      <div class="flex w-full h-[5%] border justify-around">
        <button
          v-for="(p, idxP) in phrases"
          :key="idxP"
          class="w-[10%] my-2 border rounded-lg text-center"
          @click="selectedPhrase = p"
        >
          {{ p.name }}
        </button>
        <button
          class="w-[10%] my-2 border rounded-lg text-center"
          @click="
            phrases.push({
              name: '',
              measureCount: 0,
              tempo: 120,
              patterns: [],
            })
          "
        >
          Phrase++
        </button>
      </div>
      <!-- Phrase config -->
      <div class="flex w-full h-[10%] border justify-around">
        <div class="flex flex-col w-[10%]">
          <label class="text-center">Measures</label>
          <input
            type="text"
            class="border rounded-lg text-center"
            @input="(e) => changePhraseMeasures(e)"
          />
        </div>
        <div class="flex flex-col w-[10%]">
          <label class="text-center">Tempo</label>
          <input
            type="text"
            class="border rounded-lg text-center inset"
            :placeholder="selectedPhrase?.tempo.toString()"
            @input="(e) => changePhraseTempo(e)"
          />
        </div>
        <button
          class="w-[10%] my-2 border rounded-lg text-center"
          @click="playSelectedPhrase"
        >
          Play
        </button>
        <button
          class="w-[10%] my-2 border rounded-lg text-center"
          @click="isPlaying = false"
        >
          Stop
        </button>
        <button class="w-[10%] my-2 border rounded-lg text-center" @click="">
          (Load beat)
        </button>
      </div>
      <!-- Patterns text editor -->
      <div
        v-if="selectedPhrase"
        class="w-full h-full flex flex-col items-center"
      >
        <div
          v-for="(pa, idxPa) in selectedPhrase.patterns"
          class="w-full h-[10%] flex border items-center"
        >
          <div class="w-[10%] h-full flex flex-col">
            <select
              v-model="pa.sample"
              class="w-full border rounded-lg text-center"
            >
              <option v-for="(s, idxS) in samples" :key="idxS" :value="s">
                {{ s.name }}
              </option>
            </select>
            <div
              :id="`pattern-${idxPa}`"
              class="w-full h-full flex border rounded-lg items-center justify-center"
              :style="{ backgroundColor: pa.sample.color }"
            >
              {{ pa.sample.name }}
            </div>
          </div>
          <div v-for="(m, idxM) in pa.measures" :key="idxM">
            <input
              type="text"
              class="border rounded-lg"
              @change="(e) => inputMeasureNotation(e, m)"
            />
            <select v-model="m.subdivision">
              <option :value="4">4</option>
              <option :value="8">8</option>
              <option :value="16" selected>16</option>
              <option :value="32">32</option>
            </select>
          </div>
        </div>
        <button
          v-if="samples[0]"
          class="w-full border rounded-lg text-center"
          @click="addPattern"
        >
          Patterns++
        </button>
      </div>
    </div>
    <!-- Samples config -->
    <div class="flex flex-col w-[25%] h-full border items-center">
      <!-- Options -->
      <div
        class="flex flex-wrap w-full h-[16%] border justify-around items-center"
      >
        <button
          class="w-[10%] m-1 border rounded-lg text-center"
          @click="loadSamples"
        >
          (Load)
        </button>
        <input
          id="newsample-file"
          class="w-[10%] border rounded-lg"
          type="file"
          accepts="audio/*"
          placeholder="Select file"
        />
        <input
          v-model="newSample.name"
          class="w-[20%] border rounded-lg text-center"
          type="text"
          placeholder="Enter name"
        />
        <input
          v-model="newSample.color"
          type="color"
          class="w-[20%] border-rounded-lg"
        />
        <button class="w-[10%] border rounded-lg" @click="addSample">
          Add sample
        </button>
      </div>
      <!-- Samples board -->
      <div class="w-full h-full flex flex-wrap">
        <div
          v-for="(s, idxS) in samples"
          :key="idxS"
          class="flex w-[10%] h-[10%] m-2 border border-black rounded-lg justify-center items-center select-none overflow-hidden"
          :style="{ 'background-color': s.color }"
          @mousedown="(e) => startDragSample(e, s)"
        >
          {{ s.name }}
        </div>
      </div>
    </div>
  </div>
</template>
