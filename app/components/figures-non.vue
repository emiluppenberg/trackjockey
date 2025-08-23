<script setup lang="ts">
import {
  selectAllText,
  createSample,
  createPattern,
  createFigure,
  type Measure,
} from "~/types2";
const audioStore = useAudioStore();

const samples = audioStore.samples;
const figures = audioStore.figures;
const audioContext = audioStore.audioContext!;

const isEditingMeasure = ref<Measure>();
const isPlaying = ref<boolean>(false);

function addPattern() {
  if (!audioStore.activeFigure) return;
  if (!samples[0]) return;

  audioStore.activeFigure.patterns.push(
    createPattern(samples[0], [], audioContext)
  );
}

function convertTo64Rhythm(vNotes: string): string {
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
function initialize64Melody(vNotes: string): string[] {
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

function changeFigureMeasures(e: Event) {
  // TODO Change input to number
  if (!audioStore.activeFigure) return;
  const value = (e.target as HTMLInputElement).value;
  if (Number(value)) {
    if (audioStore.activeFigure.patterns[0]) {
      const mPop = audioStore.activeFigure.patterns.flatMap((p) =>
        p.measures.filter((m) => m.index > Number(value))
      );
      if (mPop.length > 0) {
        const ok = confirm(`Continuing will remove ${mPop.length} measures`);
        if (ok) {
          for (const mp of mPop) {
            audioStore.activeFigure.patterns.flatMap((p) => {
              const idx = p.measures.findIndex((_mp) => _mp === mp);
              idx >= 0 && p.measures.splice(idx, 1);
            });
          }
        }
      }
    }
    audioStore.activeFigure.measureCount = Number(value);
  } else if (value === "") {
    return;
  } else if (!Number(value)) {
    alert("Measures must be a number");
  }
}
</script>

<template>
  <div class="flex flex-col items-center">
    <!-- Figure config -->
    <div id="figure-options" class="flex w-full border border-white">
      <div id="figure-name" class="flex border-r border-white">
        <input
          v-if="audioStore.activeFigure"
          type="text"
          class="border-t text-center"
          placeholder="Enter name"
          v-model="audioStore.activeFigure.name"
        />
      </div>
    </div>
  </div>
</template>
