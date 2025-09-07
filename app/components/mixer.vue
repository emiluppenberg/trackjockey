<script setup lang="ts">
const audioStore = useAudioStore();

function handleSetPitch(value: number) {
  audioStore.activeMixer!.pitch = value;
  audioStore.activeMixer!.pitcherNode.parameters.get("pitch")!.value =
    audioStore.activeMixer!.pitch;
}
</script>

<template>
  <div v-if="audioStore.activeMixer" id="active-mixer" class="w-full h-auto">
    <div class="w-full border-b border-l border-cyan-400 flex">
      <MixerEqualizer v-if="audioStore.eqAnalyser"></MixerEqualizer>
      <MixerCompressor v-if="audioStore.compAnalyser"></MixerCompressor>
      <!-- Pan -->
      <MixerParam
        :param-name="'Pan'"
        :param-value="audioStore.activeMixer!.pannerNode.pan.value"
        :step="1"
        :max="10"
        :min="-10"
        @set-param="
          (value) => (audioStore.activeMixer!.pannerNode.pan.value = value / 10)
        "
      ></MixerParam>
      <!-- Pitch -->
      <MixerParam
        :param-name="'Pitch'"
        :param-value="audioStore.activeMixer!.pitch"
        :step="1"
        :max="24"
        :min="-24"
        @set-param="(value) => handleSetPitch(value)"
      >
      </MixerParam>
    </div>
  </div>
</template>
