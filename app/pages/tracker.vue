<script setup lang="ts">
const audioStore = useAudioStore();
</script>

<template>
  <div class="flex">
    <TrackerMain v-if="audioStore.audioContext"></TrackerMain>
    <ActiveTrack v-if="audioStore.audioContext"></ActiveTrack>
  </div>
</template>
