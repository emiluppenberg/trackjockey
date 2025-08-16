<script setup lang="ts">
const audioStore = useAudioStore();
</script>

<template>
  <div class="flex">
    <EditorFigures v-if="audioStore.audioContext && audioStore.figures.length > 0"
    ></EditorFigures>
    <EditorSampler v-if="audioStore.audioContext"
    ></EditorSampler>
  </div>
</template>
