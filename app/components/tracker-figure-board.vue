<script setup lang="ts">
import { type Figure } from "~/types2";

const audioStore = useAudioStore();
const figures = audioStore.figures;

function changeSoundKeyBind(e: KeyboardEvent, f: Figure) {
  if (e.code === "Slash" || e.code === "Period" || e.code === "Tab") {
    return;
  }

  e.preventDefault();

  f.keyBind = e.code;
}
</script>

<template>
  <!-- Tracker board -->
  <div id="tracker-board" class="flex flex-wrap mb-1 justify-start">
    <!-- Empty button -->
    <button
      tabindex="0"
      class="w-[200px] h-[150px] mx-1 my-1 rounded-xl border border-cyan-400 text-center select-none overflow-hidden grid bg-sky-800/10"
      @click="audioStore.activeTrack!.mute = !audioStore.activeTrack!.mute"
    >
      <span class="text-center text-4xl text-green-400 place-self-center mt-5">
        MUTE
      </span>
      <input
        disabled
        class="h-[50px] text-center text-2xl text-cyan-400 border-b border-cyan-400 place-self-end w-full bg-sky-800/20"
        value="KeyQ"
      />
    </button>
    <!-- Figure buttons -->
    <button
      v-for="(f, idxF) in figures"
      tabindex="0"
      :key="idxF"
      class="w-[200px] h-[150px] mx-1 my-1 rounded-xl border border-cyan-400 text-center select-none overflow-hidden grid bg-sky-800/10"
      @click="audioStore.activeTrack!.changeFigure(f)"
    >
      <span
        class="italic text-center text-4xl text-green-400 place-self-center mt-5"
      >
        {{ f.name }}
      </span>
      <input
        class="h-[50px] text-center text-2xl text-cyan-400 w-full border-b border-cyan-400 place-self-end bg-sky-800/20"
        :value="f.keyBind ? f.keyBind : 'Bind to key'"
        @keydown="(e) => changeSoundKeyBind(e, f)"
      />
    </button>
  </div>
</template>
