<script setup lang="ts">
const audioStore = useAudioStore();
</script>

<template>
  <div class="flex flex-col w-screen h-auto overflow-y-scroll">
    <Tracker class="mt-[50px] mb-[50px]"></Tracker>
    <Mixer
      v-if="audioStore.audioContext && audioStore.tracker"
      class="w-[50%]"
    ></Mixer>
    <Editor></Editor>
  </div>
</template>
