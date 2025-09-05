<script setup lang="ts">
const audioStore = useAudioStore();
</script>

<template>
  <div v-if="audioStore.activeMixer" id="active-mixer" class="w-full h-auto">
    <div class="w-full border-b border-l border-cyan-400 flex">
      <MixerEqualizer v-if="audioStore.eqAnalyser"></MixerEqualizer>
      <MixerCompressor v-if="audioStore.compAnalyser"></MixerCompressor>
      <MixerPan></MixerPan>
      <MixerPitch></MixerPitch>
    </div>
  </div>
</template>
