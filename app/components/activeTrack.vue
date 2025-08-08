<script setup lang="ts">
import type { Measure, Track, Tracker } from "~/types2";
const emits = defineEmits([
  "changeActiveTrack",
  "focusEnableKeys",
  "changeActiveTrackFigure",
  'muteActiveTrackPattern'
]);
const props = defineProps<{
  activeTrack: Track;
  tracker: Tracker;
  cursor: number;
}>();

const isChangingActiveTrack = ref<boolean>(false);

function inputActiveTrack(e: Event) {
  const element = e.target as HTMLInputElement;
  const idxT = Number(element.value) - 1;
  element.style.color = "black";
  const t = props.tracker.tracks[idxT];
  if (t) {
    emits("changeActiveTrack", t);
  } else {
    element.style.color = "red";
  }
}
function changeActiveTrack(e: Event) {
  const element = e.target as HTMLInputElement;
  const idxT = Number(element.value) - 1;
  const t = props.tracker.tracks[idxT];
  if (t) {
    emits("changeActiveTrack", t);
    return;
  } else {
    element.value = (
      props.tracker.tracks.indexOf(props.activeTrack) + 1
    ).toString();
    element.style.color = "black";
  }
}
function handleActiveTrackFocus(e: KeyboardEvent) {
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
      handleEnableKeysFocus(e);
  }
}
function handleEnableKeysFocus(e: KeyboardEvent) {
  e.preventDefault();
  if (isChangingActiveTrack.value) {
    isChangingActiveTrack.value = !isChangingActiveTrack.value;
  }
  const enableKeysElement = document.getElementById("active-track-enable-keys");
  if (enableKeysElement) {
    enableKeysElement.focus();
  }
}
function selectAllText(e: Event) {
  const target = e.target as HTMLInputElement;
  target.select();
}
function getCursorForDNotes(m: Measure, idxC: number): boolean {
  let colonIndices: number[] = [];
  let currentNoteIdx: number = idxC;
  for (let i = 0; i < m.dNotes.length; i++) {
    if (m.dNotes[i] === ":") {
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

  const dNotesClean = m.dNotes.replaceAll(":", "");
  const fLen = 64 / dNotesClean.length;
  const nextNoteIdx = currentNoteIdx + 1;

  if (props.cursor === currentNoteIdx * fLen) {
    return true;
  }
  if (
    props.cursor < nextNoteIdx * fLen &&
    props.cursor > currentNoteIdx * fLen
  ) {
    return true;
  }

  return false;
}
onMounted(() => {
  window.addEventListener("keydown", (e) => {
    if (e.code === "BracketLeft") {
      handleActiveTrackFocus(e);
    }
    if (e.code === "BracketRight") {
      handleEnableKeysFocus(e);
    }
  });
});
</script>

<template>
  <div
    id="active-track"
    class="w-full h-[20%] flex overflow-hidden border border-black"
    :style="{ backgroundColor: activeTrack?.figure?.color }"
  >
    <div
      id="active-track-options"
      class="flex flex-col w-[15%] border-r border-black h-full items-center"
    >
      <div id="active-track-name" class="h-[30%] flex flex-col justify-evenly">
        <h2>Activetrack:</h2>
        <p id="active-track-name" class="text-center">
          {{ activeTrack?.figure?.name }}
        </p>
      </div>
      <div class="grow flex border-t border-black">
        <input
          id="active-track-input"
          type="number"
          class="text-center w-[50%] text-4xl border-r border-black"
          @input="(e) => inputActiveTrack(e)"
          @change="(e) => changeActiveTrack(e)"
          @focus="(e) => selectAllText(e)"
          @keydown.enter="(e) => handleActiveTrackFocus(e)"
          :style="{ backgroundColor: activeTrack.figure?.color }"
        />
        <button
          id="active-track-enable-keys"
          class="w-[50%] text-4xl"
          @keydown="(e: KeyboardEvent) => emits('changeActiveTrackFigure', e)"
        >
          (->)
        </button>
      </div>
    </div>
    <div
      v-if="activeTrack?.figure"
      id="active-track-patterns"
      class="flex flex-col w-[85%] border-l border-r border-white bg-black"
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
            @click="emits('muteActiveTrackPattern', p)"
          >
            {{ p.sample.name }}
          </button>
          <div
            :id="`active-track-pattern-${idxP}-measure-${idxMc}`"
            class="grow flex max-w-[45%] border-r border-white justify-between px-1"
          >
            <p
              v-for="(c, idxC) in p.measures.find((m) => m.index === idxMc)
                ?.dNotes"
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
