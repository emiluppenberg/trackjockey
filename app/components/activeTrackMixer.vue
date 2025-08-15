<script setup lang="ts">
import type { Track } from "~/types2";
const props = defineProps<{
  activeTrack: Track;
}>();
const activeTrack = ref<Track>();
const emits = defineEmits(["changeActiveTrackPitch"]);

function onChangePitch(e: Event) {
  const element = e.target as HTMLInputElement;
  const pitch = Number(element.value);
  emits("changeActiveTrackPitch", pitch);
  element.select();
}

watch(
  () => props.activeTrack,
  (newTrack) => {
    activeTrack.value = newTrack;
  }
);
</script>

<template>
  <div
    v-if="activeTrack"
    id="active-track-mixer-container"
    class="h-full border-l border-white bg-blue-600"
  >
    <input
      id="active-track-pitch"
      type="number"
      :value="activeTrack.mixer.pitchValue"
      class="w-[20%] h-[25%] border-b border-r border-white"
      @change="(e) => onChangePitch(e)"
    />
  </div>
</template>
