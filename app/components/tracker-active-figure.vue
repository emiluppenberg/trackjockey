<script setup lang="ts">
import { getCursorForVNotes, getMelodyIndex } from "~/types2";

const audioStore = useAudioStore();
const viewMode = ref<boolean>(false);
</script>

<template>
  <div
    id="tracker-active-patterns-container"
    v-if="audioStore.activeTrack && audioStore.activeTrack.figure"
    class="flex flex-col bg-slate-900"
  >
    <button
      class="w-full bg-indigo-700 h-[40px] text-white border-b"
      @click="viewMode = !viewMode"
    >
      Pitch/Velocity
    </button>
    <div class="flex w-full">
      <!-- Pattern mute buttons -->
      <div
        id="tracker-active-mute-buttons"
        class="flex flex-col w-[100px] border-r border-white"
      >
        <button
          v-for="(p, idxP) in audioStore.activeTrack?.figure.patterns"
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
        class="max-w-[1800px] flex flex-col bg-black overflow-x-auto"
      >
        <div
          :id="`tracker-active-pattern-${idxP}`"
          v-for="(p, idxP) in audioStore.activeTrack.figure.patterns"
          class="flex border-cyan-400 bg-black text-white h-[40px]"
        >
          <div
            v-for="(m, idxM) in p.measures"
            :id="`tracker-active-pattern-${idxP}-measure-${idxM}`"
            class="flex min-w-[400px] max-w-[400px] border-b border-r border-cyan-400 justify-between items-center text-2xl"
          >
            <!-- Velocity -->
            <div
              v-for="(c, idxC) in m.vNotes"
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
              v-for="(c, idxC) in m.vNotes"
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
                {{ m.m64Notes[getMelodyIndex(idxC, m.vNotes)] }}
              </div>
              <!-- NonValue -->
              <div v-else class="w-full h-full flex justify-center">
                <div class="text-xs text-center">{{ c }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
