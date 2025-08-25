<script setup lang="ts">
import { createMixer } from "~/types2";

const audioStore = useAudioStore();
const tracker = audioStore.tracker!;

function changeTrackerBpm(e: Event) {
  // TODO Change input to number
  const element = e.target as HTMLInputElement;
  const value = element.value;

  if (Number(value)) tracker.bpm = Number(value);
}

function changeTracksLength(e: Event) {
  // TODO Change input to number
  const value = (e.target as HTMLInputElement).value;

  if (Number(value)) {
    const len = Number(value);

    if (tracker.tracks.length > len) {
      for (let i = tracker.tracks.length; i > len; i--) {
        tracker.tracks.pop();
      }
    }

    if (tracker.tracks.length < len) {
      for (let i = tracker.tracks.length; i < len; i++) {
        // Make nicer
        tracker.tracks.push({
          figure: undefined,
          mixer: createMixer(audioStore.audioContext!),
          currentMeasureIdx: -1
        });
      }
    }
  }
}
</script>

<template>
  <div class="flex">
    <!-- Options -->
    <div id="tracker-options" class="flex flex-col w-[100px] h-[70px]">
      <input
        type="number"
        :value="tracker.tracks.length"
        class="w-[100px] border-r border-b border-white text-center text-3xl text-white bg-sky-400 focus:bg-sky-200"
        @change="(e) => changeTracksLength(e)"
      />
      <input
        type="text"
        class="w-[100px] border-r border-white text-center text-3xl text-white bg-sky-400 focus:bg-sky-200"
        :value="tracker.bpm.toString()"
        @change="(e) => changeTrackerBpm(e)"
      />
    </div>
    <!-- Track list -->
    <div
      id="tracker-list"
      class="flex w-full h-[70px] overflow-x-auto overflow-y-hidden"
    >
      <div
        id="tracker-list-item"
        v-for="(t, idxT) in tracker.tracks"
        :key="idxT"
        class="min-w-[150px] h-[70px] flex flex-col border-r border-cyan-400 items-center overflow-hidden"
        :class="{
          'bg-cyan-700': t !== audioStore.activeTrack,
          'bg-lime-700': t === audioStore.activeTrack,
        }"
        @click="audioStore.activeTrack = t"
      >
        <label
          class="text-3xl text-center"
          :class="{
            'text-cyan-200': t !== audioStore.activeTrack,
            'text-lime-200': t === audioStore.activeTrack,
          }"
        >
          {{ (tracker.tracks.indexOf(t) + 1).toString() }}
        </label>
        <div
          class="max-w-[130px] italic text-2xl text-center truncate pointer-events-none focus:outline-none"
          :class="{
            'text-cyan-200': t !== audioStore.activeTrack,
            'text-lime-200': t === audioStore.activeTrack,
          }"
        >
          {{ t.figure?.name || "undefined" }}
        </div>
      </div>
    </div>
  </div>
</template>
