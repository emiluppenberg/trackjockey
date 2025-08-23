<script setup lang="ts">
import { createPattern } from "~/types2";

const audioStore = useAudioStore();

const editMode = ref<boolean>(false);

function addPattern() {
  if (!audioStore.activeFigure) return;
  if (!audioStore.audioContext) return;

  audioStore.activeFigure.patterns.push(
    createPattern(audioStore.samples[0]!, [], audioStore.audioContext)
  );
}
</script>

<template>
  <div
    class="min-h-[600px] w-full bg-black text-white border-r border-b border-l border-white"
  >
    <button
      class="w-full min-h-[40px] border-b border-white bg-indigo-700"
      @click="editMode = !editMode"
    >
      Pitch/Velocity
    </button>
    <div v-if="audioStore.activeFigure" class="flex w-full">
      <!-- Pattern sample -->
      <div class="flex flex-col w-[100px]">
        <div
          :id="`pattern-${idxP}-sample`"
          v-for="(p, idxP) in audioStore.activeFigure.patterns"
          class="w-full h-[40px] border-r border-b border-white"
        >
          <select
            v-model="p.sample"
            class="w-full h-full text-center bg-blue-600"
          >
            <option
              v-for="(s, idxS) in audioStore.samples"
              :key="idxS"
              class="bg-blue-600"
              :value="s"
            >
              {{ s.name }}
            </option>
          </select>
        </div>
        <!-- New pattern -->
        <button
          class="min-w-[100px] h-[40px] border-r border-b border-white bg-sky-400 focus:bg-sky-200"
          @click="addPattern"
        >
          +
        </button>
      </div>
      <FiguresPatternsEditor :edit-mode="editMode"></FiguresPatternsEditor>
      <!-- +/- Measure buttons -->
      <div class="flex flex-col w-[100px]">
        <button
          @click="audioStore.activeFigure.measureCount += 1"
          class="bg-sky-400 focus:bg-sky-200 h-1/2 min-w-[100px] border-b border-l"
        >
          +
        </button>
        <button
          @click="audioStore.activeFigure.measureCount -= 1"
          class="bg-sky-400 focus:bg-sky-200 h-1/2 min-w-[100px] border-b border-l"
        >
          -
        </button>
      </div>
    </div>
  </div>
</template>
