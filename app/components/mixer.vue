<script setup lang="ts">
const audioStore = useAudioStore();
const ctx = audioStore.ctx!;
const tracker = audioStore.tracker!;

function inputPitch(e: Event) {
  e.preventDefault();

  const element = e.target as HTMLInputElement;
  audioStore.activeMixer!.pitch = Number(element.value);
  audioStore.activeMixer!.pitcherNode.parameters.get("pitch")!.value =
    audioStore.activeMixer!.pitch;
}
</script>

<template>
  <div
    v-if="audioStore.activeMixer"
    id="active-mixer"
    class="w-[1900px] h-auto flex flex-wrap bg-blue-600"
  >
    <div class="w-full text-center text-4xl">
      <!-- Name goes here -->
    </div>
    <div class="flex flex-col items-center">
      <label>Pitch</label>
      <input
        id="pitch"
        type="number"
        :value="audioStore.activeMixer.pitch"
        class="w-[100px] mx-1 text-center"
        @input="(e) => inputPitch(e)"
      />
    </div>
    <div class="flex flex-col items-center">
      <label>Pan</label>
      <input
        id="pan"
        type="number"
        step="0.1"
        v-model="audioStore.activeMixer.pannerNode.pan.value"
        class="w-[100px] mx-1 text-center"
      />
    </div>
    <!-- EQ -->
    <MixerEqualizer v-if="audioStore.eqAnalyser"></MixerEqualizer>
    <!-- Compressor -->
    <MixerCompressor v-if="audioStore.compAnalyser"></MixerCompressor>
  </div>
</template>
