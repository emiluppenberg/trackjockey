<script setup lang="ts">
import type { Measure } from "~/types2";

const audioStore = useAudioStore();

const editMode = ref<boolean>(false);

function addSample() {
  if (!audioStore.activeFigure) return;
  if (!audioStore.audioContext) return;
  if (!audioStore.tracker) return;

  const mLen = audioStore.activeFigure.measures[0]!.length;
  let measures: Measure[] = [];

  for (let i = 0; i < mLen; i++) {
    measures.push({ vNotes: "", m64Notes: [], v64Notes: "" });
  }

  audioStore.activeFigure.samples.push(audioStore.samples[0]!);
  audioStore.activeFigure.measures.push(measures);

  audioStore.reloadActiveFigureTracks();
}
function removeSample(idxS: number) {
  if (!audioStore.activeFigure) return;

  audioStore.activeFigure.samples.splice(idxS, 1);
  audioStore.activeFigure.measures.splice(idxS, 1);

  audioStore.reloadActiveFigureTracks();
}

function addMeasure() {
  if (!audioStore.activeFigure) return;

  audioStore.activeFigure.measures.forEach((m) =>
    m.push({ vNotes: "", m64Notes: [], v64Notes: "" })
  );
}
function removeMeasure() {
  if (!audioStore.activeFigure) return;

  audioStore.activeFigure.measures.forEach((m) => m.pop());
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
            :id="`pattern-${idxS}-sample`"
            v-for="(s, idxS) in audioStore.activeFigure.samples"
            class="flex w-full h-[40px] border-r border-b border-white"
          >
            <button
              class="w-[30px] h-full text-center bg-red-600 border-r"
              @click="removeSample(idxS)"
            >
              -
            </button>
            <select
              v-model="audioStore.activeFigure.samples[idxS]"
              class="w-[70px] h-full text-center bg-blue-600"
            >
              <option
                v-for="(_s, idx_s) in audioStore.samples"
                :key="idx_s"
                class="bg-blue-600"
                :value="_s"
              >
                {{ _s.name }}
              </option>
            </select>
          </div>
        </div>
        <FiguresSamplesMeasures :edit-mode="editMode"></FiguresSamplesMeasures>
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
      @click="addSample"
    >
      +
    </button>
  </div>
</template>
