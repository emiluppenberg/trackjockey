<script setup lang="ts">
import { Pattern } from "~/types2";

const audioStore = useAudioStore();
const ctx = audioStore.ctx!;

const editMode = ref<boolean>(false);

function addPattern() {
  const pattern = new Pattern(audioStore.samples[0]!, ctx.createGain());

  for (let i = 0; i < audioStore.activeFigure!.measureCount; i++) {
    pattern.addMeasure("0-");
  }

  audioStore.activeFigure!.patterns.push(pattern);

  audioStore.reloadActiveFigureTracks();
}

function removePattern(idxP: number) {
  audioStore.activeFigure!.patterns.splice(idxP, 1);

  audioStore.reloadActiveFigureTracks();
}

function addMeasure() {
  const index = audioStore.activeFigure!.measureCount;
  audioStore.activeFigure!.measureCount++;
  audioStore.activeFigure!.patterns.forEach((p) => p.addMeasure("0-"));
}

function removeMeasure() {
  if (!audioStore.activeFigure) return;

  audioStore.activeFigure.measureCount--;
  audioStore.activeFigure.patterns.forEach((p) => p.measures.pop());
}
</script>

<template>
  <div class="h-auto w-full text-white flex flex-wrap border-b border-t border-l">
    <div id="patterns-editor-container" class="grid grid-cols-10 justify-between w-full">
      <div
        id="patterns-editor"
        v-if="audioStore.activeFigure"
        class="col-span-9 flex"
      >
        <!-- Pattern sample -->
        <div class="flex flex-col w-[100px]">
          <div
            :id="`pattern-${idxP}-sample`"
            v-for="(p, idxP) in audioStore.activeFigure.patterns"
            class="flex w-full h-[50px] border-r border-b bg-sky-800/20"
          >
            <button
              class="w-[30px] h-full text-center text-3xl text-red-600 border-r"
              @click="removePattern(idxP)"
            >
              -
            </button>
            <select
              v-model="audioStore.activeFigure.patterns[idxP]!.sample"
              class="w-[70px] h-full text-center bg-transparent"
            >
              <option
                v-for="(s, idxS) in audioStore.samples"
                :key="idxS"
                class="bg-sky-800"
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
      <div class="col-span-1 flex flex-col">
        <button
          @click="addMeasure"
          class="text-cyan-400 text-3xl h-1/2 border-b border-l"
        >
          +
        </button>
        <button
          @click="removeMeasure"
          class="text-cyan-400 text-3xl h-1/2 border-b border-l"
        >
          -
        </button>
      </div>
    </div>
    <!-- New pattern -->
    <button
      class="w-[100px] h-[50px] text-cyan-400 text-3xl border-r bg-sky-800/20 focus:bg-sky-200"
      @click="addPattern"
    >
      +
    </button>
    <button
      class="grow h-[50px] border-t"
      @click="editMode = !editMode"
    >
      Pitch/Velocity
    </button>
  </div>
</template>
