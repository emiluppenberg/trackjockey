<script setup lang="ts">
import { equalizerAddFilter } from '~/types2';

const audioStore = useAudioStore();
const audioContext = audioStore.audioContext!;
const tracker = audioStore.tracker!;

function inputPitch(e: Event) {
  e.preventDefault();
  if (!audioStore.activeMixer) return;

  const element = e.target as HTMLInputElement;
  audioStore.activeMixer.pitchValue = Number(element.value);
  audioStore.activeMixer.pitcherNode.parameters.get("pitch")!.value =
    audioStore.activeMixer.pitchValue;
}

function inputPan(e: Event) {
  e.preventDefault();
  if (!audioStore.activeMixer) return;

  const element = e.target as HTMLInputElement;
  audioStore.activeMixer.panValue = Number(element.value);
  audioStore.activeMixer.pannerNode.pan.value = audioStore.activeMixer.panValue;
}

function inputFrequency(e: Event, idxF: number) {
  e.preventDefault();
  if (!audioStore.activeMixer) return;
  if (!audioStore.activeMixer.eq.filterNodes[idxF]) return;

  const element = e.target as HTMLInputElement;
  audioStore.activeMixer.eq.filterFreqs[idxF] = Number(element.value);
  audioStore.activeMixer.eq.filterNodes[idxF].frequency.value =
    audioStore.activeMixer.eq.filterFreqs[idxF];
}

function inputGain(e: Event, idxF: number) {
  e.preventDefault();
  if (!audioStore.activeMixer) return;
  if (!audioStore.activeMixer.eq.filterNodes[idxF]) return;

  const element = e.target as HTMLInputElement;
  audioStore.activeMixer.eq.filterGains[idxF] = Number(element.value);
  audioStore.activeMixer.eq.filterNodes[idxF].gain.value =
    audioStore.activeMixer.eq.filterGains[idxF];
}

function inputDetune(e: Event, idxF: number) {
  e.preventDefault();
  if (!audioStore.activeMixer) return;
  if (!audioStore.activeMixer.eq.filterNodes[idxF]) return;

  const element = e.target as HTMLInputElement;
  audioStore.activeMixer.eq.filterDetunes[idxF] = Number(element.value);
  audioStore.activeMixer.eq.filterNodes[idxF].detune.value =
    audioStore.activeMixer.eq.filterDetunes[idxF];
}

function inputQ(e: Event, idxF: number) {
  e.preventDefault();
  if (!audioStore.activeMixer) return;
  if (!audioStore.activeMixer.eq.filterNodes[idxF]) return;

  const element = e.target as HTMLInputElement;
  audioStore.activeMixer.eq.filterQs[idxF] = Number(element.value);
  audioStore.activeMixer.eq.filterNodes[idxF].Q.value =
    audioStore.activeMixer.eq.filterQs[idxF];
}

function selectFilterType(e: Event, idxF: number) {
  e.preventDefault();
  if (!audioStore.activeMixer) return;
  if (!audioStore.activeMixer.eq.filterNodes[idxF]) return;

  const value = (e.target as HTMLSelectElement).value;
  audioStore.activeMixer.eq.filterNodes[idxF].type = (value as BiquadFilterType);
}

function addFilter(){
  if (!audioStore.activeMixer) return;

  equalizerAddFilter(audioContext, audioStore.activeMixer.eq);
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
        :value="audioStore.activeMixer.pitchValue"
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
        :value="audioStore.activeMixer.panValue"
        class="w-[100px] mx-1 text-center"
        @input="(e) => inputPan(e)"
      />
    </div>
    <!-- EQ -->
    <div class="flex flex-col items-center">
      <div
        :id="`filter-${idxF}`"
        v-for="(f, idxF) in audioStore.activeMixer.eq.filterNodes"
        class="flex justify-center"
      >
        <h1 class="text-4xl">Filter {{ idxF }}</h1>
        <div class="flex flex-col items-center">
          <label>Type</label>
          <select v-model="f.type">
            <option :value="(('lowpass') as BiquadFilterType)">Lowpass</option>
            <option :value="(('highpass') as BiquadFilterType)">Highpass</option>
            <option :value="(('bandpass') as BiquadFilterType)">Bandpass</option>
            <option :value="(('lowshelf') as BiquadFilterType)">Lowshelf</option>
            <option :value="(('highshelf') as BiquadFilterType)">Highshelf</option>
            <option :value="(('peaking') as BiquadFilterType)">Peaking</option>
            <option :value="(('notch') as BiquadFilterType)">Notch</option>
          </select>
        </div>
        <div class="flex flex-col items-center">
          <label>Frequency</label>
          <input
            :id="`filter-${idxF}-frequency`"
            type="number"
            step="100"
            :value="audioStore.activeMixer.eq.filterFreqs[idxF]"
            class="w-[100px] mx-1 text-center"
            @input="(e) => inputFrequency(e, idxF)"
          />
        </div>
        <div class="flex flex-col items-center">
          <label>Gain</label>
          <input
            :id="`filter-${idxF}-gain`"
            type="number"
            step="1"
            :value="audioStore.activeMixer.eq.filterGains[idxF]"
            class="w-[100px] mx-1 text-center"
            @input="(e) => inputGain(e, idxF)"
          />
        </div>
        <div class="flex flex-col items-center">
          <label>Detune</label>
          <input
            :id="`filter-${idxF}-detune`"
            type="number"
            step="10"
            :value="audioStore.activeMixer.eq.filterDetunes[idxF]"
            class="w-[100px] mx-1 text-center"
            @input="(e) => inputDetune(e, idxF)"
          />
        </div>
        <div class="flex flex-col items-center">
          <label>Q</label>
          <input
            :id="`filter-${idxF}-q`"
            type="number"
            step="0.1"
            :value="audioStore.activeMixer.eq.filterQs[idxF]"
            class="w-[100px] mx-1 text-center"
            @input="(e) => inputQ(e, idxF)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
