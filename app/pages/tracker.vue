<script setup lang="ts">
const audioStore = useAudioStore();
</script>

<template>
  <div class="flex">
    <TrackerMain v-if="audioStore.audioContext && audioStore.tracker"></TrackerMain>
    <ActiveTrack v-if="audioStore.audioContext && audioStore.tracker"></ActiveTrack>
  </div>
</template>
