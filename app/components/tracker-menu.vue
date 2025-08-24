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
  <div id="tracker-menu" class="flex border-b border-white">
    <!-- Active track -->
    <TrackerList></TrackerList>
  </div>
</template>
