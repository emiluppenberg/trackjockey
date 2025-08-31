<script setup lang="ts">
import { getCursorForVNotes, getMelodyIndex } from "~/types2";

const audioStore = useAudioStore();
const viewMode = ref<boolean>(false);

async function changeActiveTrackCurrentMeasure(idxM: number) {
  if (!audioStore.activeTrack) return;

  audioStore.activeTrack.currentMeasureIdx = idxM;
}

async function changeActiveTrackNextMeasure(e: MouseEvent, idxM: number) {
  e.preventDefault();
  if (!audioStore.activeTrack) return;

  audioStore.activeTrack.nextMeasureIdxs.push(idxM);
}

function checkNextMeasureIdxs(idxM: number): boolean {
  return (
    audioStore.activeTrack?.nextMeasureIdxs.some((i) => i === idxM) ?? false
  );
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
        <button
          v-for="(p, idxP) in audioStore.activeTrack?.figure?.patterns"
          class="h-[40px] text-center overflow-x-hidden overflow-y-hidden border-b border-white"
          :class="{ 'bg-green-600': !p.mute, 'bg-red-600': p.mute }"
          @click="
            () => {
              p.mute = !p.mute;
            }
          "
        >
          {{ p.sample.name }}
        </button>
      </div>
      <!-- Patterns and measures -->
      <div
        id="tracker-active-patterns"
        class="max-w-[1800px] min-h-[40px] flex flex-col bg-black overflow-x-auto"
      >
        <div
          :id="`tracker-active-pattern-${idxP}`"
          v-for="(p, idxP) in audioStore.activeTrack?.figure?.patterns"
          class="flex border-cyan-400 bg-black text-white h-[40px]"
        >
          <div
            v-for="(m, idxM) in p.measures"
            :id="`tracker-active-pattern-${idxP}-measure-${idxM}`"
            class="relative flex min-w-[400px] max-w-[400px] border-b border-r justify-between items-center text-2xl"
            :class="{
              'border-cyan-400': !checkNextMeasureIdxs(idxM),
              'border-lime-400': checkNextMeasureIdxs(idxM),
            }"
            @click="changeActiveTrackCurrentMeasure(idxM)"
            @click.right="(e) => changeActiveTrackNextMeasure(e, idxM)"
          >
            <!-- Velocity -->
            <div
              v-for="(c, idxC) in m.notes"
              class="text-center w-[2em]"
              :class="{
                'text-emerald-600': getCursorForVNotes(m, idxC, idxM),
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
                'text-emerald-600': getCursorForVNotes(m, idxC, idxM),
                hidden: !viewMode,
              }"
            >
              <!-- Value -->
              <div
                v-if="Number(c)"
                class="flex italic text-xs text-center justify-center border-l border-cyan-400"
              >
                {{ m.pitch64[getMelodyIndex(idxC, m.notes)] }}
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
              {{ audioStore.activeTrack?.nextMeasureIdxs.indexOf(idxM)! + 1 }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
