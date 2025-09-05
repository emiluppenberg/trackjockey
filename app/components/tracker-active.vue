<script setup lang="ts">
import { Measure, type Pattern } from "~/types2";

const audioStore = useAudioStore();
const viewMode = ref<boolean>(false);

function checkNextMeasureIdxs(idxM: number): boolean {
  return audioStore.activeTrack!.nextMeasures.some((i) => i === idxM) ?? false;
}

function checkCursor(p: Pattern, m: Measure, idxM: number, idxC: number) {
  if (audioStore.activeTrack!.currentMeasure !== idxM) return false;
  if (!p.measures[idxM]!.notes) return;

  const value =
    p.measures[idxM]!.notes![m.cursorPos!.findIndex((cp) => cp === idxC)];

  if (!value) return false;

  if (audioStore.cursor === value.pos64) return true;

  return false;
}

function handleClickMeasure(e: MouseEvent, idxM: number) {
  if (e.altKey) {
    viewMode.value = !viewMode.value;
    return;
  }

  audioStore.activeTrack!.setCurrentMeasure(idxM, audioStore.cursor);
}
</script>

<template>
  <div id="tracker-active-container" class="flex w-full overflow-x-auto">
    <!-- Pattern samples -->
    <div
      v-if="audioStore.activeTrack!.figure"
      id="tracker-active-samples"
      class="flex flex-col min-w-[100px] border-r border-l border-cyan-400 bg-sky-800/20"
    >
      <div
        v-for="(p, idxP) in audioStore.activeTrack!.figure?.patterns"
        class="min-h-[50px] w-[100px] grow flex justify-center items-center text-white overflow-x-hidden overflow-y-hidden border-b border-cyan-400"
      >
        <span>{{ p.sample.name }}</span>
      </div>
    </div>
    <!-- Patterns and measures -->
    <div
      v-if="audioStore.activeTrack!.figure"
      id="tracker-active-patterns"
      class="min-h-[50px] w-full flex flex-col bg-black overflow-x-auto"
      :class="{
        'bg-black': !audioStore.activeTrack!.mute,
        'bg-red-500': audioStore.activeTrack!.mute,
      }"
    >
      <div
        :id="`tracker-active-pattern-${idxP}`"
        v-for="(p, idxP) in audioStore.activeTrack!.figure?.patterns"
        class="flex text-white h-[50px] border-b border-cyan-400"
      >
        <div
          v-for="(m, idxM) in p.measures"
          :id="`tracker-active-pattern-${idxP}-measure-${idxM}`"
          class="relative flex min-w-[400px] max-w-[400px] border-r justify-between items-center text-2xl"
          :class="{
            'border-cyan-400': !checkNextMeasureIdxs(idxM),
            'border-lime-400': checkNextMeasureIdxs(idxM),
          }"
          @click.prevent="(e) => handleClickMeasure(e, idxM)"
          @click.right.prevent="
            () => audioStore.activeTrack!.nextMeasures.push(idxM)
          "
        >
          <!-- Velocity -->
          <div
            v-for="(c, idxC) in m.notation"
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
            v-for="(c, idxC) in m.notation"
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
</template>
