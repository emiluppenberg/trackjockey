<script setup lang="ts">
const audioStore = useAudioStore();
const activeTrackIdx = ref<number>(0);

function handleChangeActiveTrack(idxT: number) {
  activeTrackIdx.value = idxT;
}
</script>

<template>
  <div class="flex flex-wrap w-full h-full">
    <TrackerOptions v-if="audioStore.audioContext && audioStore.tracker"></TrackerOptions>
    <Mixer v-if="audioStore.audioContext && audioStore.tracker" class="w-[50%]" :active-track-idx="activeTrackIdx"></Mixer>
    <TrackerActive v-if="audioStore.audioContext && audioStore.tracker" @change-active-track="(idxT: number) => handleChangeActiveTrack(idxT)"></TrackerActive>
  </div>
</template>
