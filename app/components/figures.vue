<script setup lang="ts">
const audioStore = useAudioStore();
</script>

<template>
  <!-- Figures.vue -->
  <div class="flex flex-col w-[1900px] h-auto bg-sky-800 border">
    <FiguresList v-if="audioStore.ctx"></FiguresList>
    <FiguresPatterns v-if="audioStore.ctx"></FiguresPatterns>
  </div>
</template>
