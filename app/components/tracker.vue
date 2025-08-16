<script setup lang="ts">
const audioStore = useAudioStore();
</script>

<template>
  <div class="flex flex-col w-full h-auto">
    <TrackerActive
      v-if="audioStore.audioContext && audioStore.tracker"
    ></TrackerActive>
    <TrackerOptions
      v-if="audioStore.audioContext && audioStore.tracker"
    ></TrackerOptions>
  </div>
</template>
