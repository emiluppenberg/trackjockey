<script setup lang="ts">
const audioStore = useAudioStore();
</script>

<template>
  <div class="flex flex-col w-auto h-auto bg-sky-800">
    <FiguresList v-if="audioStore.audioContext"></FiguresList>
    <FiguresPatterns v-if="audioStore.audioContext"></FiguresPatterns>
  </div>
</template>
