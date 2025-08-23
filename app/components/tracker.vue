<script setup lang="ts">
const audioStore = useAudioStore();
</script>

<template>
  <div class="flex w-auto h-auto bg-sky-800">
    <TrackerMenu
      v-if="audioStore.audioContext && audioStore.tracker"
      class="w-[150px] h-[600px]"
    ></TrackerMenu>
    <div class="flex flex-col w-full">
      <TrackerActiveFigure
        v-if="audioStore.activeTrack"
        class="h-[300px]"
      ></TrackerActiveFigure>
      <TrackerBoard class="h-[300px]"></TrackerBoard>
    </div>
  </div>
</template>
