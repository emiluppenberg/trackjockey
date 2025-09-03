<script setup lang="ts">
const audioStore = useAudioStore();
</script>

<template>
  <div class="flex flex-col w-screen h-auto overflow-y-scroll">
    <button class="w-full border my-1" @click="audioStore.logLog">
      Log
    </button>
    <Tracker
      v-if="audioStore.ctx && audioStore.tracker"
      class="mx-[30px] my-[50px]"
    ></Tracker>
    <Mixer
      v-if="audioStore.ctx && audioStore.tracker"
      class="mx-[30px]"
    ></Mixer>
    <Figures class="mx-[30px] my-[50px]"></Figures>
    <Sampler v-if="audioStore.ctx" class="mx-[30px]"></Sampler>
  </div>
</template>
