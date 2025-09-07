<script setup lang="ts">
import { xToHz, handleScrollAudioParam, selectAllText } from "~/types2";

const audioStore = useAudioStore();
const ctx = audioStore.ctx!;
const fCanvas = ref<HTMLCanvasElement>();
const aCanvas = ref<HTMLCanvasElement>();

const activeFilterIdx = ref<number>(0);

const canvasWidth = 400;
const canvasHeight = 200;

let freqHz = new Float32Array(canvasWidth);
let magResponse = new Float32Array(canvasWidth);
let phaseResponse = new Float32Array(canvasWidth);

let array = new Uint8Array(audioStore.eq_fftSize);

const filterTypeRefs = ref<string[]>(
  audioStore.activeMixer!.filterNodes.map((f) => f.type)
);

watch(
  () => audioStore.activeMixer,
  (newMixer) => {
    if (newMixer) {
      activeFilterIdx.value = 0;
      filterTypeRefs.value = newMixer.filterNodes.map((f) => f.type);
      drawFilter();
    }
  }
);
watch(
  () => audioStore.isPlaying,
  (value) => {
    if (value) drawAudio();
  }
);

onMounted(() => {
  initFreqHz();
});

function changeFilterType(e: Event, activeFilterIdx: number) {
  const element = e.target as HTMLInputElement;
  audioStore.activeMixer!.filterNodes[activeFilterIdx]!.type =
    element.value as BiquadFilterType;
  filterTypeRefs.value[activeFilterIdx] = element.value;
  console.log(filterTypeRefs.value[activeFilterIdx]);
}

function initFreqHz() {
  for (let i = 0; i < canvasWidth; i++) {
    freqHz[i] = xToHz(i, canvasWidth);
  }
}

function drawFilter() {
  if (!fCanvas.value) return;
  const f = audioStore.activeMixer!.filterNodes[activeFilterIdx.value];
  if (!f) return;

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

function drawAudio() {
  if (!aCanvas.value) return;
  if (audioStore.isPlaying) {
    const id = requestAnimationFrame(drawAudio);
  }

  const w = aCanvas.value.width;
  const h = aCanvas.value.height;

  audioStore.eqAnalyser!.getByteTimeDomainData(array);

  const canCtx = aCanvas.value.getContext("2d")!;
  canCtx.clearRect(0, 0, w, h);
  canCtx.lineWidth = 2;
  canCtx.strokeStyle = "#22d3ee";
  canCtx.beginPath();

  const slice = w / array.length;
  let x = 0;

  for (let i = 0; i < array.length; i++) {
    let v = array[i]! / 128.0;
    let y = (v * h) / 2;

    if (i === 0) canCtx.moveTo(x, y);
    else canCtx.lineTo(x, y);

    x += slice;
  }

  canCtx.stroke();
  if (!audioStore.isPlaying) canCtx.clearRect(0, 0, w, h);
}
</script>

<template>
  <div
    class="flex flex-col border-r border-cyan-400"
    :style="{ width: `${canvasWidth}px` }"
  >
    <!-- Visual -->
    <div
      class="relative bg-transparent"
      :style="{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }"
    >
      <canvas ref="aCanvas" class="w-full h-full absolute inset-0"></canvas>
      <canvas ref="fCanvas" class="w-full h-full absolute inset-0"></canvas>
    </div>
    <!-- Select filters -->
    <div class="flex h-[50px] border-b border-t border-cyan-400">
      <button
        v-for="(f, idxF) in filterTypeRefs"
        class="w-[100px] border-r border-cyan-400 text-md text-cyan-400 flex items-center justify-center"
        :class="{
          'bg-sky-800/20 text-cyan-400': idxF !== activeFilterIdx,
          'bg-indigo-700/20 text-lime-200': idxF === activeFilterIdx,
        }"
        @click="
          () => {
            console.log(f);
            activeFilterIdx = idxF;
            drawFilter();
          }
        "
      >
        <span class="pointer-events-none">{{ f }}</span>
      </button>
    </div>
    <!-- Config filters -->
    <div
      id="filter-options"
      v-if="audioStore.activeMixer!.filterNodes[activeFilterIdx]"
      class="flex justify-center h-[50px] bg-sky-800/20"
    >
      <div
        class="relative h-[50px] w-[100px] pt-1 flex flex-col text-xs text-center border-r border-cyan-400 hover:cursor-pointer"
      >
        <span>Type</span>
        <select
          class="absolute inset-0 pt-4 h-full text-center text-lg text-cyan-400 bg-transparent hover:cursor-pointer"
          v-model="audioStore.activeMixer!.filterNodes[activeFilterIdx]!.type"
          @change="
            (e) => {
              changeFilterType(e, activeFilterIdx);
              drawFilter();
            }
          "
          @focus="drawFilter()"
        >
          <option class="bg-slate-800" value="lowpass">Lowpass</option>
          <option class="bg-slate-800" value="highpass">Highpass</option>
          <option class="bg-slate-800" value="bandpass">Bandpass</option>
          <option class="bg-slate-800" value="lowshelf">Lowshelf</option>
          <option class="bg-slate-800" value="highshelf">Highshelf</option>
          <option class="bg-slate-800" value="peaking">Peaking</option>
          <option class="bg-slate-800" value="notch">Notch</option>
        </select>
      </div>
      <div
        class="relative h-[50px] w-[100px] pt-1 flex flex-col text-xs text-center border-r border-cyan-400 hover:cursor-pointer"
      >
        <span>Frequency</span>
        <input
          id="filter-frequency"
          type="number"
          step="100"
          v-model="
            audioStore.activeMixer!.filterNodes[activeFilterIdx]!.frequency
              .value
          "
          class="absolute inset-0 pt-4 h-full text-center text-xl text-cyan-400 bg-transparent hover:cursor-pointer"
          @wheel.prevent="
            (e) => {
              handleScrollAudioParam(
                e,
                audioStore.activeMixer!.filterNodes[activeFilterIdx]!.frequency
              );
              drawFilter();
              selectAllText(e);
            }
          "
          @input="drawFilter()"
          @focus="
            (e) => {
              drawFilter();
              selectAllText(e);
            }
          "
        />
      </div>
      <div
        class="relative h-[50px] w-[66px] pt-1 flex flex-col text-xs text-center border-r border-cyan-400 hover:cursor-pointer"
      >
        Gain
        <input
          id="filter-gain"
          type="number"
          step="1"
          v-model="
            audioStore.activeMixer!.filterNodes[activeFilterIdx]!.gain.value
          "
          class="absolute inset-0 pt-4 h-full text-center text-xl text-cyan-400 bg-transparent hover:cursor-pointer"
          @wheel.prevent="
            (e) => {
              handleScrollAudioParam(
                e,
                audioStore.activeMixer!.filterNodes[activeFilterIdx]!.gain
              );
              drawFilter();
              selectAllText(e);
            }
          "
          @input="drawFilter()"
          @focus="
            (e) => {
              drawFilter();
              selectAllText(e);
            }
          "
        />
      </div>
      <div
        class="relative h-[50px] w-[66px] pt-1 flex flex-col text-xs text-center border-r border-cyan-400 hover:cursor-pointer"
      >
        Detune
        <input
          id="filter-detune"
          type="number"
          step="10"
          v-model="
            audioStore.activeMixer!.filterNodes[activeFilterIdx]!.detune.value
          "
          class="absolute inset-0 pt-4 h-full text-center text-xl text-cyan-400 bg-transparent hover:cursor-pointer"
          @wheel.prevent="
            (e) => {
              handleScrollAudioParam(
                e,
                audioStore.activeMixer!.filterNodes[activeFilterIdx]!.detune
              );
              drawFilter();
              selectAllText(e);
            }
          "
          @input="drawFilter()"
          @focus="
            (e) => {
              drawFilter();
              selectAllText(e);
            }
          "
        />
      </div>
      <div
        class="relative h-[50px] w-[66px] pt-1 flex flex-col text-xs text-center hover:cursor-pointer"
      >
        Q
        <input
          id="filter-q"
          type="number"
          step="1"
          v-model="
            audioStore.activeMixer!.filterNodes[activeFilterIdx]!.Q.value
          "
          class="absolute inset-0 pt-4 h-full text-center text-xl text-cyan-400 bg-transparent hover:cursor-pointer"
          @wheel.prevent="
            (e) => {
              handleScrollAudioParam(
                e,
                audioStore.activeMixer!.filterNodes[activeFilterIdx]!.Q
              );
              drawFilter();
              selectAllText(e);
            }
          "
          @input="drawFilter()"
          @focus="
            (e) => {
              drawFilter();
              selectAllText(e);
            }
          "
        />
      </div>
    </div>
  </div>
</template>
