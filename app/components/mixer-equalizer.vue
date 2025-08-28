<script setup lang="ts">
import { melToX, xToHz } from "~/types2";

const audioStore = useAudioStore();
const audioContext = audioStore.audioContext!;
const keepDrawing = ref<boolean>(false);
const fCanvas = ref<HTMLCanvasElement>();
const aCanvas = ref<HTMLCanvasElement>();

const canvasWidth = 400;
const canvasHeight = 200;

let freqHz = new Float32Array(canvasWidth);
let magResponse = new Float32Array(canvasWidth);
let phaseResponse = new Float32Array(canvasWidth);

let array = new Uint8Array(audioStore.eq_fftSize);

watch(
  () => audioStore.isPlaying,
  (value) => {
    if (value) {
      keepDrawing.value = true;
      drawAudio();
    }
    if (!value) keepDrawing.value = false;
  }
);

onMounted(() => {
  initFreqHz();
});

function initFreqHz() {
  for (let i = 0; i < canvasWidth; i++) {
    freqHz[i] = xToHz(i, canvasWidth);
  }
}

function drawFilter(f: BiquadFilterNode) {
  if (!fCanvas.value) return;
  if (!audioStore.activeMixer) return;

  const canCtx = fCanvas.value.getContext("2d")!;
  const w = fCanvas.value.width;
  const h = fCanvas.value.height;
  canCtx.clearRect(0, 0, w, h);

  f.getFrequencyResponse(freqHz, magResponse, phaseResponse);

  canCtx.beginPath();
  const EPS = 1e-12;
  const DB_TOP = 60;
  const DB_BOTTOM = -60;

  const db0 = 20 * Math.log10(Math.max(magResponse[0]!, EPS));
  const norm0 = (db0 - DB_BOTTOM) / (DB_TOP - DB_BOTTOM);
  const y0 = (1 - norm0) * h;
  canCtx.moveTo(0, y0);

  for (let i = 0; i < w; i++) {
    const db = 20 * Math.log10(Math.max(magResponse[i]!, EPS));
    const norm = (db - DB_BOTTOM) / (DB_TOP - DB_BOTTOM);
    const y = (1 - norm) * h;
    canCtx.lineTo(i, y);
  }

  canCtx.strokeStyle = `rgb(50 50 50)`;

  canCtx.stroke();
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

function drawAudio() {
  if (!audioStore.eqAnalyser) return;
  if (!aCanvas.value) return;
  if (keepDrawing.value) {
    const id = requestAnimationFrame(drawAudio);
  }

  const w = aCanvas.value.width;
  const h = aCanvas.value.height;

  const canCtx = aCanvas.value.getContext("2d")!;
  canCtx.clearRect(0, 0, w, h);

  const barW = (w / audioStore.eqAnalyser.frequencyBinCount) * 2.5;
  let barH;
  let x = 0;

  audioStore.eqAnalyser.getByteFrequencyData(array);

  for (let i = 0; i < array.length; i++) {
    barH = array[i]!;
    canCtx.fillStyle = '#22d3ee';
    canCtx.fillRect(x, h - barH / 2, barW, barH);

    x += barW + 1;
  }

  if (!keepDrawing.value) {
    canCtx.clearRect(0, 0, w, h);
  }
}
</script>

<template>
  <div class="flex w-auto h-auto bg-slate-800 items-center border-l">
    <!-- Filters -->
    <div v-if="audioStore.activeMixer" class="flex flex-col min-h-[200px]">
      <button class="bg-emerald-600 border" @click="addFilter">+</button>
      <div
        :id="`filter-${idxF}`"
        v-for="(f, idxF) in audioStore.activeMixer.filterNodes"
        class="flex justify-center items-center"
      >
        <div class="flex flex-col items-center">
          <label>Type</label>
          <select
            v-model="f.type"
            @change="drawFilter(f)"
            @focus="drawFilter(f)"
          >
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
            @input="drawFilter(f)"
            @focus="drawFilter(f)"
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
            @input="drawFilter(f)"
            @focus="drawFilter(f)"
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
            @input="drawFilter(f)"
            @focus="drawFilter(f)"
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
            @input="drawFilter(f)"
            @focus="drawFilter(f)"
          />
        </div>
        <button
          class="w-[50px] bg-red-600 border text-center me-1"
          @click="removeFilter(idxF)" 
        >
          -
        </button>
      </div>
    </div>
    <!-- Visual -->
    <div
      class="relative bg-black"
      :style="{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }"
    >
      <canvas ref="aCanvas" class="w-full h-full absolute inset-0"></canvas>
      <canvas ref="fCanvas" class="w-full h-full absolute inset-0"></canvas>
    </div>
  </div>
</template>
