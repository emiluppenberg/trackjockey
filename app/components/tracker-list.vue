<script setup lang="ts">
import { Track } from "~/types2";

const audioStore = useAudioStore();
const ctx = audioStore.ctx!;
const tracker = audioStore.tracker!;
const tracksLength = ref<number>(audioStore.tracker!.tracks.length);

watch(tracksLength, (newLength) => {
  if (newLength) tracker.setLength(newLength);
});

function changeTrackFigure(e: KeyboardEvent, t: Track) {
  if (e.code === "Tab") return;

  e.preventDefault();

  if (e.code === "KeyQ") {
    t.mute = !t.mute;
    return;
  }

  const f = audioStore.figures.find((_f) => _f.keyBind === e.code);

  if (f) t.changeFigure(f);
}

function changeTrackNextFigure(e: KeyboardEvent, t: Track) {
  if (e.code === "Tab") return;

  e.preventDefault();

  const f = audioStore.figures.find((_f) => _f.keyBind === e.code);

  if (f) t.nextFigure = f.clone(ctx);
}

function focusTrackNextFigure(e: MouseEvent, idxT: number, t: Track) {
  e.preventDefault();

  if (!t.nextFigure) t.nextFigure = tracker.tracks[0]!.figure;

  nextTick(() => {
    const element = document.getElementById(`track-${idxT}-next-figure`);
    console.log(element);
    if (element) element.focus();
  });
}
</script>

<template>
  <div id="tracker-list" class="flex min-h-[100px]">
    <div
      id="tracker-list-items"
      class="flex w-full overflow-x-auto border-t border-b border-cyan-400 rounded-tl-xl"
    >
      <div
        :id="`track-${idxT}`"
        v-for="(t, idxT) in tracker.tracks"
        :key="idxT"
        class="max-w-[150px] min-w-[150px] min-h-[100px] max-h-[150px] flex flex-col border-r border-cyan-400 first:border-l first:rounded-tl-xl"
        :class="{
          'bg-sky-800/10': t !== audioStore.activeTrack,
          'bg-indigo-700/20': t === audioStore.activeTrack,
        }"
      >
        <button
          class="w-full min-h-[100px] grow flex flex-col text-3xl text-center justify-center items-center overflow-hidden select-none"
          :class="{
            'text-green-400': t !== audioStore.activeTrack,
            'text-lime-200': t === audioStore.activeTrack,
          }"
          @focus="audioStore.activeTrack = t"
          @keydown="(e) => changeTrackFigure(e, t)"
          @click.right="(e) => focusTrackNextFigure(e, idxT, t)"
        >
          {{ idxT + 1 }}
          <label class="italic hover:cursor-pointer">
            {{ t.figure?.name || "undefined" }}
          </label>
        </button>
        <input
          tabindex="-1"
          v-if="t.nextFigure"
          :id="`track-${idxT}-next-figure`"
          class="w-full h-[50px] text-md text-center border-t border-cyan-400 focus:outline-emerald-300 bg-transparent hover:cursor-pointer"
          :class="{
            'text-green-400': t !== audioStore.activeTrack,
            'text-lime-200': t === audioStore.activeTrack,
          }"
          :value="`PUSH (${t.nextFigure.name})`"
          @focus="audioStore.activeTrack = t"
          @keydown="(e) => changeTrackNextFigure(e, t)"
          @click.right="(e) => focusTrackNextFigure(e, idxT, t)"
        />
      </div>
    </div>
  </div>
</template>
