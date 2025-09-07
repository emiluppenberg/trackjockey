<script setup lang="ts">
const audioStore = useAudioStore();
</script>

<template>
  <div class="flex flex-col w-auto h-auto overflow-y-scroll">
    <Tracker
      v-if="audioStore.ctx && audioStore.tracker"
      class="pl-[30px] mt-[50px]"
    ></Tracker>
    <Mixer
      v-if="audioStore.ctx && audioStore.activeMixer"
      class="pl-[30px]"
    ></Mixer>
    <Figures class="px-[30px] my-[50px]"></Figures>
    <Sampler v-if="audioStore.ctx" class="px-[30px]"></Sampler>
  </div>
</template>
