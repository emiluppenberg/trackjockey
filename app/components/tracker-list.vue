<script setup lang="ts">
import { createMixer } from '~/types2';

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
        });
      }
    }
  }
}
</script>

<template>
    <!-- Track list -->
    <div
      id="tracker-list"
      class="flex flex-col w-full h-full overflow-y-auto overflow-x-hidden"
    >
      <div
        id="tracker-list-item"
        v-for="(t, idxT) in tracker.tracks"
        :key="idxT"
        class="flex flex-col border-b border-cyan-400 items-start"
        :class="{
          'bg-cyan-700': t !== audioStore.activeTrack,
          'bg-lime-700': t === audioStore.activeTrack,
        }"
        @click="audioStore.activeTrack = t"
      >
        <label
          class="block truncate overflow-hidden italic"
          :class="{
            'text-cyan-200': t !== audioStore.activeTrack,
            'text-lime-200': t === audioStore.activeTrack,
          }"
        >
          {{
            (tracker.tracks.indexOf(t) + 1).toString() + ": " + t.figure?.name
          }}
        </label>
      </div>
    </div>
    <!-- Options -->
    <div id="tracker-options" class="flex h-[50px] border-t border-white">
      <div class="flex">
        <input
          type="number"
          :value="tracker.tracks.length"
          class="w-[75px] border-r border-white text-center text-3xl text-white bg-sky-400 focus:bg-sky-200"
          @change="(e) => changeTracksLength(e)"
        />
        <input
          type="text"
          class="w-[75px] text-center text-3xl text-white bg-sky-400 focus:bg-sky-200"
          :value="tracker.bpm.toString()"
          @change="(e) => changeTrackerBpm(e)"
        />
      </div>
    </div>
</template>