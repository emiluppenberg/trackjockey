<script setup lang="ts">
import { type Figure, type Sample } from "~/types2";

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
  <div id="tracker-board" class="flex border-b">
    <!-- Figures -->
    <div class="w-full h-full flex flex-wrap content-start mb-1">
      <!-- Empty button -->
      <button
        tabindex="0"
        class="w-[200px] h-[150px] border border-cyan-400 text-center select-none overflow-hidden grid bg-cyan-700 ml-1 mt-1"
      >
        <span
          class="italic text-center text-4xl text-cyan-200 place-self-center mt-5"
        >
          undefined
        </span>
        <input
          disabled
          class="text-center text-2xl text-white border-t border-cyan-400 place-self-end w-full bg-sky-400"
          value="KeyQ"
        />
      </button>
      <!-- Figure buttons -->
      <button
        v-for="(f, idxF) in figures"
        tabindex="0"
        :key="idxF"
        class="w-[200px] h-[150px] border border-cyan-400 text-center select-none overflow-hidden grid bg-cyan-700 ml-1 mt-1"
      >
        <span
          class="italic text-center text-4xl text-cyan-200 place-self-center mt-5"
        >
          {{ f.name }}
        </span>
        <input
          class="text-center text-2xl text-white w-full border-t border-cyan-400 place-self-end bg-sky-400"
          :value="f.keyBind ? f.keyBind : 'Bind to key'"
          @keydown="(e) => changeSoundKeyBind(e, f)"
        />
      </button>
    </div>
  </div>
</template>
