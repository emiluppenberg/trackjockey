<script setup lang="ts">
import { selectAllText, type Measure, type Track } from "~/types2";
const audioStore = useAudioStore();
const audioContext = audioStore.audioContext!;
const tracker = audioStore.tracker!;
const tracks = audioStore.tracker!.tracks;
const figures = audioStore.figures;

function handleActiveInputKeyDown(e: KeyboardEvent) {
  const key = e.key;
  const element = e.target as HTMLButtonElement;
  element.style.color = "white";

  if (key === "Tab") return;
  e.preventDefault();

  if (key === "Backspace") {
    element.textContent = "";
    return;
  }

  if (Number(key)) {
    // Digit input
    const idxT = Number(element.textContent + key) - 1;
    const t = tracks[idxT];

    if (t) {
      audioStore.activeTrack = t;
      element.textContent = element.textContent + key;
    }
  }

  if (key === "ArrowUp") {
    const idxT = Number(element.textContent); // Zero based index!
    const t = tracks[idxT];

    if (t) {
      audioStore.activeTrack = t;
      element.textContent = (idxT + 1).toString();
    }
  }

  if (key === "ArrowDown") {
    const idxT = Number(element.textContent) - 2; // Zero based index!
    const t = tracks[idxT];

    if (t) {
      audioStore.activeTrack = t;
      element.textContent = idxT.toString();
    }
  } else changeActiveTrackFigure(e);
}

function focusActiveInput(e: KeyboardEvent) {
  e.preventDefault();

  const element = document.getElementById("active-input");
  if (element) element.focus();
}

async function changeActiveTrackFigure(e: KeyboardEvent) {
  if (e.code === "Tab") return;
  if (!audioStore.activeTrack) return;

  e.preventDefault();

  if (e.code === "KeyQ") {
    audioStore.activeTrack.figure = undefined;
    return;
  }

  const f = figures.find((_f) => _f.keyBind === e.code);

  if (f) {
    audioStore.activeTrack.figure = f;
    await audioStore.mixerConnectTrack(audioStore.activeTrack);
  }
}

function toggleActiveTrackMix() {
  audioStore.activeMixer = audioStore.activeTrack?.mixer;
}

onMounted(() => {
  window.addEventListener("keydown", (e) => {
    if (e.code === "BracketLeft") {
      focusActiveInput(e);
    }
  });
});
</script>

<template>
  <div id="tracker-active" class="flex h-[40px] border-t border-b border-white">
    <button
      id="active-input"
      class="w-[950px] border-r border-white text-white text-center text-3xl bg-indigo-700 focus:bg-indigo-400 select-text"
      @keydown="(e) => handleActiveInputKeyDown(e)"
    >
      {{ tracks.indexOf(audioStore.activeTrack!) + 1 }}
    </button>
    <button
      id="active-mix"
      class="w-[950px] text-white text-3xl bg-indigo-700 focus:bg-indigo-400"
      @click="toggleActiveTrackMix"
    >
      MIX
    </button>
  </div>
</template>
