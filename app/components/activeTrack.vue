<script setup lang="ts">
import type { Measure, Track } from "~/types2";
import { selectAllText } from "~/types2";
import ActiveTrackMixer from "./activeTrackMixer.vue";
const audioStore = useAudioStore();
const tracks = audioStore.tracker.tracks;
const figures = audioStore.figures;
const cursor = audioStore.cursor;
const activeTrack = ref<Track>();

const isChangingActiveTrack = ref<boolean>(false);

function inputActiveTrack(e: Event) {
  const element = e.target as HTMLInputElement;
  const idxT = Number(element.value) - 1;
  element.style.color = "black";
  const t = tracks[idxT];
  if (t) {
    activeTrack.value = t;
  } else {
    element.style.color = "red";
  }
}
function changeActiveTrack(e: Event) {
  const element = e.target as HTMLInputElement;
  const idxT = Number(element.value) - 1;
  const t = tracks[idxT];
  if (t) {
    activeTrack.value = t;
    return;
  } else {
    element.value = (
      tracks.indexOf(activeTrack.value!) + 1
    ).toString();
    element.style.color = "black";
  }
}
function activeTrackFocus(e: KeyboardEvent) {
  e.preventDefault();
  isChangingActiveTrack.value = !isChangingActiveTrack.value;
  switch (isChangingActiveTrack.value) {
    case true:
      const activeTrackElement = document.getElementById("active-track-input");
      if (activeTrackElement) {
        activeTrackElement.focus();
      }
      break;
    case false:
      enableKeysFocus(e);
  }
}
function enableKeysFocus(e: KeyboardEvent) {
  e.preventDefault();
  if (isChangingActiveTrack.value) {
    isChangingActiveTrack.value = !isChangingActiveTrack.value;
  }
  const enableKeysElement = document.getElementById("active-track-enable-keys");
  if (enableKeysElement) {
    enableKeysElement.focus();
  }
}
function changeActiveTrackFigure(e: KeyboardEvent) {
  if (e.code === "Tab") {
    return;
  }

  e.preventDefault();

  if (activeTrack.value) {
    if (e.code === "KeyQ") {
      activeTrack.value.figure = undefined;
      return;
    }

    const f = figures.find((_f) => _f.keyBind === e.code);
    if (f) {
      activeTrack.value.figure = f;
    }
  }
}
function getCursorForDNotes(m: Measure, idxC: number): boolean {
  let colonIndices: number[] = [];
  let currentNoteIdx: number = idxC;
  for (let i = 0; i < m.rNotes.length; i++) {
    if (m.rNotes[i] === ":") {
      colonIndices.push(i);
    }
  }
  if (colonIndices.includes(idxC)) {
    return false;
  }
  for (const colonIdx of colonIndices) {
    if (idxC > colonIdx) {
      currentNoteIdx -= 1;
    }
  }

  const dNotesClean = m.rNotes.replaceAll(":", "");
  const fLen = 64 / dNotesClean.length;
  const nextNoteIdx = currentNoteIdx + 1;

  if (cursor === currentNoteIdx * fLen) {
    return true;
  }
  if (
    cursor < nextNoteIdx * fLen &&
    cursor > currentNoteIdx * fLen
  ) {
    return true;
  }

  return false;
}

function handleChangeActiveTrackPitch(pitch: number) {
  if (activeTrack.value){
    activeTrack.value.pitch = pitch;
    activeTrack.value.pitchProcessor.parameters.get('pitch')!.value = pitch;
  }
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
    class="w-full h-full flex flex-col overflow-hidden border border-black"
    :style="{ backgroundColor: activeTrack?.figure?.color }"
  >
  <button class="w-full border-b border-black" @click="console.log(activeTrack)">click</button>
    <div
      id="active-track-options"
      class="flex w-full h-[5%] border-r border-black"
    >
      <div
        id="active-track-name"
        class="w-1/3 text-4xl text-center border-r border-black"
      >
        {{ activeTrack?.figure?.name }}
      </div>
      <input
        id="active-track-input"
        type="number"
        class="w-1/3 border-r border-black text-center text-4xl"
        @input="(e) => inputActiveTrack(e)"
        @change="(e) => changeActiveTrack(e)"
        @focus="(e) => selectAllText(e)"
        @keydown.enter="(e) => activeTrackFocus(e)"
        :style="{ backgroundColor: activeTrack?.figure?.color }"
      />
      <button
        id="active-track-enable-keys"
        class="w-1/3 text-4xl"
        @keydown="(e: KeyboardEvent) => changeActiveTrackFigure(e)"
      >
        (->)
      </button>
    </div>
    <div
      v-if="activeTrack?.figure"
      id="active-track-patterns"
      class="flex flex-col w-full h-[15%] border-l border-r border-white bg-black overflow-y-scroll"
    >
      <template v-for="(p, idxP) in activeTrack.figure.patterns" :key="idxP">
        <div
          :id="`active-track-pattern-${idxP}`"
          v-for="idxMc in activeTrack.figure.measureCount"
          :key="idxMc"
          class="flex border-b border-white bg-black text-white"
        >
          <button
            class="text-center w-[10%] overflow-x-hidden border-r border-white"
            :class="{ 'bg-green-600': !p.mute, 'bg-red-600': p.mute }"
            @click="() => {p.mute = !p.mute}"
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
    <div id="active-track-mixer" class="w-full h-full">
      <ActiveTrackMixer v-if="activeTrack" :active-track="activeTrack" @change-active-track-pitch="(pitch: number) => handleChangeActiveTrackPitch(pitch)"></ActiveTrackMixer>
    </div>
  </div>
</template>
