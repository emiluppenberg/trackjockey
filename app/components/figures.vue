<script setup lang="ts">
const audioStore = useAudioStore();
</script>

<template>
  <!-- Figures.vue -->
  <div class="flex flex-col w-full h-auto">
    <FiguresList v-if="audioStore.ctx" ></FiguresList>
    <FiguresPatterns v-if="audioStore.ctx"></FiguresPatterns>
  </div>
</template>
