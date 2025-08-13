<script setup lang="ts">
const audioStore = useAudioStore();
</script>

<template>
  <div class="flex">
    <Figures v-if="audioStore.audioContext"
    ></Figures>
    <Sampler v-if="audioStore.audioContext"
    ></Sampler>
  </div>
</template>
