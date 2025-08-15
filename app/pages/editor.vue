<script setup lang="ts">
const audioStore = useAudioStore();
</script>

<template>
  <div class="flex">
    <Figures v-if="audioStore.audioContext && audioStore.figures.length > 0"
    ></Figures>
    <Sampler v-if="audioStore.audioContext"
    ></Sampler>
  </div>
</template>
