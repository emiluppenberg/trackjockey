<script setup lang="ts">
import { createMeasure, createPattern, type Measure } from "~/types2";

const audioStore = useAudioStore();

const editMode = ref<boolean>(false);

function addPattern() {
  if (!audioStore.activeFigure) return;
  if (!audioStore.audioContext) return;
  if (!audioStore.tracker) return;

  let measures: Measure[] = [];

  for (let i = 0; i < audioStore.activeFigure.measureCount; i++) {
    measures.push(createMeasure(""));
  }

  audioStore.activeFigure.patterns.push(
    createPattern(audioStore.samples[0]!, [], audioStore.audioContext)
  );

  audioStore.reloadActiveFigureTracks();
}

function removePattern(idxP: number) {
  if (!audioStore.activeFigure) return;

  audioStore.activeFigure.patterns.splice(idxP, 1);

  audioStore.reloadActiveFigureTracks();
}

function addMeasure() {
  if (!audioStore.activeFigure) return;

  audioStore.activeFigure.measureCount++;
  audioStore.activeFigure.patterns.forEach((p) =>
    p.measures.push(createMeasure(""))
  );
}

function removeMeasure() {
  if (!audioStore.activeFigure) return;

  audioStore.activeFigure.measureCount--;
  audioStore.activeFigure.patterns.forEach((p) => p.measures.pop());
}
</script>

<template>
  <div class="h-auto w-full bg-slate-900 text-white">
    <button
      class="w-full min-h-[40px] bg-indigo-700 border-b"
      @click="editMode = !editMode"
    >
      Pitch/Velocity
    </button>
    <div id="patterns-editor-container" class="flex justify-between w-full">
      <div
        id="patterns-editor"
        v-if="audioStore.activeFigure"
        class="flex w-full"
      >
        <!-- Pattern sample -->
        <div class="flex flex-col w-[100px]">
          <div
            :id="`pattern-${idxP}-sample`"
            v-for="(p, idxP) in audioStore.activeFigure.patterns"
            class="flex w-full h-[40px] border-r border-b border-white"
          >
            <button
              class="w-[30px] h-full text-center bg-red-600 border-r"
              @click="removePattern(idxP)"
            >
              -
            </button>
            <select
              v-model="audioStore.activeFigure.patterns[idxP]!.sample"
              class="w-[70px] h-full text-center bg-blue-600"
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
        </div>
        <FiguresPatternsMeasures
          :edit-mode="editMode"
        ></FiguresPatternsMeasures>
      </div>
      <!-- +/- Measure buttons -->
      <div class="flex flex-col max-w-[100px]">
        <button
          @click="addMeasure"
          class="bg-sky-400 focus:bg-sky-200 h-1/2 min-w-[100px] border-b border-l"
        >
          +
        </button>
        <button
          @click="removeMeasure"
          class="bg-sky-400 focus:bg-sky-200 h-1/2 min-w-[100px] border-b border-l"
        >
          -
        </button>
      </div>
    </div>
    <!-- New pattern -->
    <button
      class="min-w-[100px] h-[40px] border-r bg-sky-400 focus:bg-sky-200"
      @click="addPattern"
    >
      +
    </button>
  </div>
</template>
