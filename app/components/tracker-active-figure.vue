<script setup lang="ts">
import { type Measure, getCursorForVNotes } from '~/types2';

const audioStore = useAudioStore();


</script>

<template>
    <div
      id="active-track-patterns"
      class="flex flex-col bg-black border border-white overflow-y-auto"
    >
      <template
        v-if="audioStore.activeTrack && audioStore.activeTrack.figure"
        v-for="(p, idxP) in audioStore.activeTrack.figure.patterns"
        :key="idxP"
      >
        <div
          :id="`active-track-pattern-${idxP}`"
          v-for="idxMc in audioStore.activeTrack.figure.measureCount"
          :key="idxMc"
          class="flex border-b border-white bg-black text-white h-[40px]"
        >
          <button
            class="text-center w-[100px] overflow-x-hidden border-r border-white"
            :class="{ 'bg-green-600': !p.mute, 'bg-red-600': p.mute }"
            @click="
              () => {
                p.mute = !p.mute;
              }
            "
          >
            {{ p.sample.name }}
          </button>
          <div
            :id="`active-track-pattern-${idxP}-measure-${idxMc}`"
            class="grow flex max-w-[45%] border-r border-white justify-between items-center px-1"
          >
            <p
              v-for="(c, idxC) in p.measures.find((m) => m.index === idxMc)
                ?.vNotes"
              class="text-center text-2xl"
              :class="{
                'text-emerald-600': getCursorForVNotes(
                  p.measures.find((m) => m.index === idxMc)!,
                  idxC
                ),
              }"
            >
              {{ c }}
            </p>
          </div>
        </div>
      </template>
    </div>
</template>