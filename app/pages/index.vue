<script setup lang="ts">
const audioStore = useAudioStore();
</script>

<template>
  <div class="flex flex-col w-screen h-auto overflow-y-scroll">
    <button class="w-full border my-1">Log</button>
    <Tracker class="mx-[30px] my-[50px]"></Tracker>
    <Mixer
      v-if="audioStore.audioContext && audioStore.tracker"
      class="mx-[30px]"
    ></Mixer>
    <Figures class="mx-[30px] my-[50px]"></Figures>
    <Sampler v-if="audioStore.audioContext" class="mx-[30px]"></Sampler>
  </div>
</template>
