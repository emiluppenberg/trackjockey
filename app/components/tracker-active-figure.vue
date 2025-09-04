<script setup lang="ts">
import { Measure, type Pattern } from "~/types2";

const audioStore = useAudioStore();
const viewMode = ref<boolean>(false);

function checkNextMeasureIdxs(idxM: number): boolean {
  return audioStore.activeTrack!.nextMeasures.some((i) => i === idxM) ?? false;
}

function checkCursor(p: Pattern, m: Measure, idxM: number, idxC: number) {
  if (audioStore.activeTrack!.currentMeasure !== idxM) return false;

  const value = p.notePos[idxM]![m.cursorPos.findIndex((cp) => cp === idxC)];

  if (!value) return false;

  if (audioStore.cursor === value.pos64) return true;

  return false;
}
</script>

<template>
  <div
    id="tracker-active-patterns-container"
    class="flex flex-col bg-slate-900"
  >
    <!-- <button
      class="w-full bg-indigo-700 h-[40px] text-white border-b"
      @click="viewMode = !viewMode"
    >
      Pitch/Velocity
    </button> -->
    <div class="flex w-full border-t">
      <!-- Pattern mute buttons -->
      <div
        id="tracker-active-mute-buttons"
        class="flex flex-col w-[100px] border-r border-white"
      >
        <div
          v-for="(p, idxP) in audioStore.activeTrack!.figure?.patterns"
          class="h-[40px] text-center text-white overflow-x-hidden overflow-y-hidden border-b border-white"
        >
          {{ p.sample.name }}
        </div>
      </div>
      <!-- Patterns and measures -->
      <div
        id="tracker-active-patterns"
        class="max-w-[1800px] min-h-[40px] flex flex-col bg-black overflow-x-auto"
        :class="{
          'bg-black': !audioStore.activeTrack!.mute,
          'bg-red-500': audioStore.activeTrack!.mute,
        }"
      >
        <div
          :id="`tracker-active-pattern-${idxP}`"
          v-for="(p, idxP) in audioStore.activeTrack!.figure?.patterns"
          class="flex border-cyan-400 text-white h-[40px]"
        >
          <div
            v-for="(m, idxM) in p.measures"
            :id="`tracker-active-pattern-${idxP}-measure-${idxM}`"
            class="relative flex min-w-[400px] max-w-[400px] border-b border-r justify-between items-center text-2xl"
            :class="{
              'border-cyan-400': !checkNextMeasureIdxs(idxM),
              'border-lime-400': checkNextMeasureIdxs(idxM),
            }"
            @click="() => (audioStore.activeTrack!.setCurrentMeasure(idxM))"
            @click.right.prevent="() => audioStore.activeTrack!.nextMeasures.push(idxM)"
          >
            <!-- Velocity -->
            <div
              v-for="(c, idxC) in m.notes"
              class="text-center w-[2em]"
              :class="{
                'text-emerald-600': checkCursor(p, m, idxM, idxC),
                hidden: viewMode,
              }"
            >
              {{ c }}
            </div>
            <!-- Melody -->
            <div
              v-for="(c, idxC) in m.notes"
              class="text-center w-[2em]"
              :class="{
                'text-emerald-600': checkCursor(p, m, idxM, idxC),
                hidden: !viewMode,
              }"
            >
              <!-- Value -->
              <div
                v-if="Number(c)"
                class="flex italic text-xs text-center justify-center border-l border-cyan-400"
              >
                {{ c }}
              </div>
              <!-- NonValue -->
              <div v-else class="w-full h-full flex justify-center">
                <div class="text-xs text-center">{{ c }}</div>
              </div>
            </div>
            <!-- NextMeasure -->
            <div
              v-if="checkNextMeasureIdxs(idxM)"
              class="absolute inset-0 opacity-50 text-center text-4xl text-lime-400"
            >
              {{ audioStore.activeTrack!.nextMeasures.indexOf(idxM)! + 1 }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
