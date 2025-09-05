<script setup lang="ts">
import { handleScrollValue, selectAllText, Track } from "~/types2";

const audioStore = useAudioStore();
const tracker = audioStore.tracker!;
const tracksLength = ref<number>(audioStore.tracker!.tracks.length);

watch(tracksLength, (newLength) => {
  if (newLength) tracker.setLength(newLength);
});

function pushTracksNextFigure() {
  const tracks = tracker.tracks.filter((t) => t.nextFigure);

  for (const t of tracks) {
    t.pushNextFigure();
  }
}
</script>

<template>
    <div id="tracker-options" class="w-full flex justify-center text-white">
      <div
        class="h-[50px] w-[100px] border-r border-t border-l rounded-tl-xl border-cyan-400 text-xs text-center bg-sky-800/20 hover:cursor-pointer"
      >
        Tracks
        <input
          type="number"
          step="1"
          min="0"
          max="20"
          class="w-[100px] h-[30px] text-center text-3xl text-cyan-400 bg-transparent hover:cursor-pointer"
          v-model="tracksLength"
          @focus="(e) => selectAllText(e)"
        />
      </div>
      <div
        class="h-[50px] w-[100px] border-r border-t border-cyan-400 text-xs text-center bg-sky-800/20 hover:cursor-pointer"
      >
        BPM
        <input
          type="number"
          step="1"
          min="0"
          class="w-[100px] h-[30px] text-center text-3xl text-cyan-400 bg-transparent hover:cursor-pointer"
          v-model="tracker.bpm"
          @wheel.prevent="(e) => handleScrollValue(e)"
          @focus="(e) => selectAllText(e)"
        />
      </div>
      <button
        :disabled="!tracker.tracks.some((t) => t.nextFigure)"
        class="w-[100px] h-[50px] border-r border-t border-cyan-400 rounded-tr-xl text-center text-xl text-cyan-400 bg-sky-800/20"
        @click="pushTracksNextFigure"
      >
        PUSH
      </button>
    </div>
</template>