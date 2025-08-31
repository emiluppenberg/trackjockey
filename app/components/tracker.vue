<script setup lang="ts">
const audioStore = useAudioStore();
const isKeyDown = ref<boolean>(false);

async function handlePlayOrStop(e: KeyboardEvent) {
  switch (audioStore.isPlaying) {
    case true:
      await audioStore.stopTracker();
      return;
    case false:
      await audioStore.startTracker();
      return;
  }
}

onMounted(() => {
  const spaceKeyDownListener = async (e: KeyboardEvent) => {
    if (e.code === "Space" && !isKeyDown.value) {
      e.preventDefault();
      isKeyDown.value = true;
      await handlePlayOrStop(e);
    }
  };
  const spaceKeyUpListener = async (e: KeyboardEvent) => {
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
    <TrackerActiveFigure
      class="h-auto"
    ></TrackerActiveFigure>
  </div>
</template>
