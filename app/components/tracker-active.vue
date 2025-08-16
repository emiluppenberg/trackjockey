<script setup lang="ts">
import { selectAllText, type Measure, type Track } from "~/types2";
const audioStore = useAudioStore();
const audioContext = audioStore.audioContext!;
const tracker = audioStore.tracker!;
const tracks = audioStore.tracker!.tracks;
const figures = audioStore.figures;
const activeTrack = ref<Track>(tracks[0]!);
const isChangingActiveTrack = ref<boolean>(false);

function inputActiveTrack(e: Event) {
  const element = e.target as HTMLInputElement;
  element.style.color = "black";

  const idxT = Number(element.value) - 1;
  const t = tracks[idxT];

  if (t) {
    activeTrack.value = t;
    audioStore.activeTrackIdx = idxT;
  } else element.style.color = "red";
}
function changeActiveTrack(e: Event) {
  const element = e.target as HTMLInputElement;
  const idxT = Number(element.value) - 1;
  const t = tracks[idxT];

  if (t) {
    activeTrack.value = t;
    audioStore.activeTrackIdx = idxT;
    return;
  } else {
    element.value = (tracks.indexOf(activeTrack.value!) + 1).toString();
    element.style.color = "black";
  }
}
function activeTrackFocus(e: KeyboardEvent) {
  e.preventDefault();
  isChangingActiveTrack.value = !isChangingActiveTrack.value;

  switch (isChangingActiveTrack.value) {
    case true:
      const activeTrackElement = document.getElementById("active-track-input");
      if (activeTrackElement) activeTrackElement.focus();
      break;
    case false:
      enableKeysFocus(e);
      break;
  }
}
function enableKeysFocus(e: KeyboardEvent) {
  e.preventDefault();

  if (isChangingActiveTrack.value)
    isChangingActiveTrack.value = !isChangingActiveTrack.value;

  const enableKeysElement = document.getElementById("active-track-enable-keys");

  if (enableKeysElement) enableKeysElement.focus();
}
function changeActiveTrackFigure(e: KeyboardEvent) {
  if (e.code === "Tab") return;

  e.preventDefault();

  if (e.code === "KeyQ") {
    activeTrack.value.figure = undefined;
    return;
  }

  const f = figures.find((_f) => _f.keyBind === e.code);

  if (f) activeTrack.value.figure = f;
}
function toggleActiveTrackMix() {
  audioStore.activeMixer = activeTrack.value.mixer;
}
function getCursorForDNotes(m: Measure, idxC: number): boolean {
  let colonIndices: number[] = [];
  let currentNoteIdx: number = idxC;

  for (let i = 0; i < m.rNotes.length; i++) {
    if (m.rNotes[i] === ":") colonIndices.push(i);
  }

  if (colonIndices.includes(idxC)) return false;

  for (const colonIdx of colonIndices) {
    if (idxC > colonIdx) currentNoteIdx -= 1;
  }

  const dNotesClean = m.rNotes.replaceAll(":", "");
  const fLen = 64 / dNotesClean.length;
  const nextNoteIdx = currentNoteIdx + 1;

  if (audioStore.cursor === currentNoteIdx * fLen) return true;

  if (
    audioStore.cursor < nextNoteIdx * fLen &&
    audioStore.cursor > currentNoteIdx * fLen
  )
    return true;

  return false;
}

onMounted(() => {
  window.addEventListener("keydown", (e) => {
    if (e.code === "BracketLeft") {
      activeTrackFocus(e);
    }
    if (e.code === "BracketRight") {
      enableKeysFocus(e);
    }
  });
});
</script>

<template>
  <div
    id="active-track"
    class="grow w-full h-auto flex flex-col overflow-hidden"
  >
    <div
      id="active-track-options"
      class="flex w-[600px] h-[50px] self-center justify-evenly"
    >
      <input
        id="active-track-input"
        type="number"
        class="w-1/3 border border-white text-white text-center text-3xl bg-sky-400"
        :value="tracks.indexOf(activeTrack) + 1"
        @input="(e) => inputActiveTrack(e)"
        @change="(e) => changeActiveTrack(e)"
        @focus="(e) => selectAllText(e)"
        @keydown.enter="(e) => activeTrackFocus(e)"
      />
      <button
        id="active-track-enable-keys"
        class="w-1/3 italic text-2xl text-white border border-white bg-sky-400"
        @keydown="(e: KeyboardEvent) => changeActiveTrackFigure(e)"
      >
        -> {{ activeTrack.figure?.name || 'undefined'}} <-
      </button>
      <button
        id="active-track-mix"
        class="w-1/3 text-white text-3xl border border-white bg-sky-400"
        @click="toggleActiveTrackMix"
      >
        Mix
      </button>
    </div>
    <div
      id="active-track-patterns"
      class="flex flex-col w-full h-[200px] bg-black overflow-y-scroll"
    >
      <div v-if="!activeTrack.figure" class="h-full border border-red"></div>
      <template
        v-if="activeTrack.figure"
        v-for="(p, idxP) in activeTrack.figure.patterns"
        :key="idxP"
      >
        <div
          :id="`active-track-pattern-${idxP}`"
          v-for="idxMc in activeTrack.figure.measureCount"
          :key="idxMc"
          class="flex border-b border-white bg-black text-white"
        >
          <button
            class="text-center w-[10%] overflow-x-hidden border-r border-white"
            :class="{ 'bg-green-600': !p.mute, 'bg-red-600': p.mute }"
            @click="
              () => {
                p.mute = !p.mute;
              }
            "
          >
            {{ p.sample.name }}
          </button>
          <div
            :id="`active-track-pattern-${idxP}-measure-${idxMc}`"
            class="grow flex max-w-[45%] border-r border-white justify-between px-1"
          >
            <p
              v-for="(c, idxC) in p.measures.find((m) => m.index === idxMc)
                ?.rNotes"
              class="text-center font-semibold"
              :class="{
                'text-emerald-600': getCursorForDNotes(
                  p.measures.find((m) => m.index === idxMc)!,
                  idxC
                ),
              }"
            >
              {{ c }}
            </p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
