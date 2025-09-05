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
  <div class="flex flex-col w-full h-auto">
    <TrackerFigureBoard class="h-auto mb-7"></TrackerFigureBoard>
    <TrackerOptions></TrackerOptions>
    <TrackerList></TrackerList>
    <TrackerActive class="h-auto"></TrackerActive>
  </div>
</template>
