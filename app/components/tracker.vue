<script setup lang="ts">
const audioStore = useAudioStore();
const isKeyDown = ref<boolean>(false);

function handlePlayOrStop(e: KeyboardEvent) {
  switch (audioStore.isPlaying) {
    case true:
      audioStore.stopTracker();
      return;
    case false:
      audioStore.playTracker();
      return;
  }
}

onMounted(() => {
  const spaceKeyDownListener = (e: KeyboardEvent) => {
    if (e.code === "Space" && !isKeyDown.value) {
      e.preventDefault();
      isKeyDown.value = true;
      handlePlayOrStop(e);
    }
  };
  const spaceKeyUpListener = (e: KeyboardEvent) => {
    isKeyDown.value = false;
  };

  window.addEventListener("keydown", spaceKeyDownListener);
  window.addEventListener("keyup", spaceKeyUpListener);

  onBeforeUnmount(() => {
    window.removeEventListener("keydown", spaceKeyDownListener);
    window.removeEventListener("keyup", spaceKeyUpListener);
  });
});
</script>

<template>
  <!-- Tracker.vue -->
  <div class="flex flex-col w-[1900px] h-auto bg-sky-800 border">
    <TrackerBoard class="h-auto"></TrackerBoard>
    <TrackerList
      v-if="audioStore.audioContext && audioStore.tracker"
    ></TrackerList>
    <TrackerActive v-if="audioStore.audioContext && audioStore.tracker"></TrackerActive>
    <TrackerActiveFigure
      v-if="audioStore.activeTrack"
      class="h-auto"
    ></TrackerActiveFigure>
  </div>
</template>
