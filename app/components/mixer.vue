<script setup lang="ts">
const audioStore = useAudioStore();
const audioContext = audioStore.audioContext!;
const tracker = audioStore.tracker!;

function inputPitch(e: Event) {
  e.preventDefault();
  if (!audioStore.activeMixer) return;

  const element = e.target as HTMLInputElement;
  audioStore.activeMixer.pitch = Number(element.value);
  audioStore.activeMixer.pitcherNode.parameters.get("pitch")!.value =
    audioStore.activeMixer.pitch;
}

function addFilter() {
  if (!audioStore.activeMixer) return;

  const filter = audioContext.createBiquadFilter();
  filter.frequency.value = 24000; // Default
  filter.type = "lowpass"; // Default

  audioStore.activeMixer.filterNodes.push(filter);
  audioStore.mixerConnect(audioStore.activeMixer);
}

function removeFilter(idxF: number) {
  if (!audioStore.activeMixer) return;

  audioStore.activeMixer.filterNodes.splice(idxF, 1);
  audioStore.mixerConnect(audioStore.activeMixer);
}
</script>

<template>
  <div
    v-if="audioStore.activeMixer"
    id="active-mixer"
    class="w-[1900px] h-auto flex flex-wrap bg-blue-600"
  >
    <div class="w-full text-center text-4xl">
      {{ audioStore.activeMixerName }}
    </div>
    <div class="w-full text-center text-4xl">
      <button class="bg-blue-600" @click="addFilter">+Filter</button>
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
    <div class="flex flex-col items-center">
      <div
        :id="`filter-${idxF}`"
        v-for="(f, idxF) in audioStore.activeMixer.filterNodes"
        class="flex justify-center"
      >
        <h1 class="text-4xl">Filter {{ idxF }}</h1>
        <div class="flex flex-col items-center">
          <label>Type</label>
          <select v-model="f.type">
            <option :value="'lowpass' as BiquadFilterType">Lowpass</option>
            <option :value="'highpass' as BiquadFilterType">Highpass</option>
            <option :value="'bandpass' as BiquadFilterType">Bandpass</option>
            <option :value="'lowshelf' as BiquadFilterType">Lowshelf</option>
            <option :value="'highshelf' as BiquadFilterType">Highshelf</option>
            <option :value="'peaking' as BiquadFilterType">Peaking</option>
            <option :value="'notch' as BiquadFilterType">Notch</option>
          </select>
        </div>
        <div class="flex flex-col items-center">
          <label>Frequency</label>
          <input
            :id="`filter-${idxF}-frequency`"
            type="number"
            step="100"
            v-model="f.frequency.value"
            class="w-[100px] mx-1 text-center"
          />
        </div>
        <div class="flex flex-col items-center">
          <label>Gain</label>
          <input
            :id="`filter-${idxF}-gain`"
            type="number"
            step="1"
            v-model="f.gain.value"
            class="w-[100px] mx-1 text-center"
          />
        </div>
        <div class="flex flex-col items-center">
          <label>Detune</label>
          <input
            :id="`filter-${idxF}-detune`"
            type="number"
            step="10"
            v-model="f.detune.value"
            class="w-[100px] mx-1 text-center"
          />
        </div>
        <div class="flex flex-col items-center">
          <label>Q</label>
          <input
            :id="`filter-${idxF}-q`"
            type="number"
            step="0.1"
            v-model="f.Q.value"
            class="w-[100px] mx-1 text-center"
          />
        </div>
        <button
          class="w-[50px] bg-red-600 border text-center"
          @click="removeFilter(idxF)"
        >
          -
        </button>
      </div>
    </div>
    <!-- Compressor -->
    <div id="mixer-compressor" class="flex flex-col items-center">
      <div class="flex">
        <div id="compressor-threshold" class="flex flex-col items-center">
          <label>Threshold</label>
          <input
            type="number"
            step="100"
            v-model="audioStore.activeMixer.compressorNode.threshold.value"
            class="w-[100px] mx-1 text-center"
          />
        </div>
        <div id="compressor-knee" class="flex flex-col items-center">
          <label>Knee</label>
          <input
            type="number"
            step="100"
            v-model="audioStore.activeMixer.compressorNode.knee.value"
            class="w-[100px] mx-1 text-center"
          />
        </div>
        <div id="compressor-ratio" class="flex flex-col items-center">
          <label>Ratio</label>
          <input
            type="number"
            step="100"
            v-model="audioStore.activeMixer.compressorNode.ratio.value"
            class="w-[100px] mx-1 text-center"
          />
        </div>
        <div id="compressor-attack" class="flex flex-col items-center">
          <label>Attack</label>
          <input
          type="number"
          step="100"
          v-model="audioStore.activeMixer.compressorNode.attack.value"
          class="w-[100px] mx-1 text-center"
          />
        </div>
        <div id="compressor-release" class="flex flex-col items-center">
          <label>Release</label>
          <input
            type="number"
            step="100"
            v-model="audioStore.activeMixer.compressorNode.release.value"
            class="w-[100px] mx-1 text-center"
          />
        </div>
        <div id="compressor-reduction" class="flex flex-col items-center"> 
          <label>Reduction</label>
          <input
            disabled
            type="number"
            step="100"
            v-model="audioStore.activeMixer.compressorNode.reduction"
            class="w-[100px] mx-1 text-center"
          />
        </div>
      </div>
    </div>
  </div>
</template>
