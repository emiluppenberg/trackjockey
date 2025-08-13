<script setup lang="ts">
import type { Track } from "~/types2";
const props = defineProps<{
  activeTrack: Track;
}>();
const activeTrack = props.activeTrack;
const emits = defineEmits(["changeActiveTrackPitch"]);

function onChangePitch(e: Event) {
  const element = e.target as HTMLInputElement;
  const pitch = Number(element.value);
  emits("changeActiveTrackPitch", pitch);
  element.select();
}
</script>

<template>
    <div
      id="active-track-mixer-container"
      class="h-full border-l border-white bg-blue-600"
    >
      <input
        id="active-track-pitch"
        type="number"
        :value="activeTrack.pitch"
        class="w-[20%] h-[25%] border-b border-r border-white"
        @change="(e) => onChangePitch(e)"
      />
      <button class="bg-white" @click="console.log(activeTrack.figure)">Pitch</button>
    </div>
</template>
