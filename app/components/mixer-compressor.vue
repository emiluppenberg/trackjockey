<script setup lang="ts">
import {
  handleScrollValue,
  handleScrollAudioParam,
  selectAllText,
} from "~/types2";

const audioStore = useAudioStore();
const cCanvas = ref<HTMLCanvasElement>();
const aCanvas = ref<HTMLCanvasElement>();

let array = new Uint8Array(audioStore.comp_fftSize);

const canvasWidth = 200;
const canvasHeight = 200;

const attackRef = ref<number>(
  Math.round(audioStore.activeMixer!.compressorNode.attack.value * 1000)
);

watch(
  () => attackRef.value,
  (value) => {
    if (value) {
      audioStore.activeMixer!.compressorNode.attack.value = value / 1000;
      drawCompressor(0);
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
  drawCompressor(0);
});

function drawCompressor(outputY: number) {
  if (!cCanvas.value) return;

  const comp = audioStore.activeMixer!.compressorNode!;
  const w = cCanvas.value.width;
  const h = cCanvas.value.height;

  const DB_TOP = 60;
  const DB_BOTTOM = -60;

  const thresholdNorm =
    (comp.threshold.value - DB_BOTTOM) / (DB_TOP - DB_BOTTOM);
  const thresholdY = (1 - thresholdNorm) * h;

  const kneeNorm = (comp.knee.value - DB_BOTTOM) / (DB_TOP - DB_BOTTOM);
  const kneeSpan = h / 2 - (1 - kneeNorm) * h;

  const attackWidth = comp.attack.value * w;

  const canCtx = cCanvas.value.getContext("2d")!;
  canCtx.clearRect(0, 0, w, h);

  // Draw knee first (behind)
  const cx = attackWidth;
  const cy = thresholdY;
  const r = kneeSpan;
  const thetaEnd = (310 * Math.PI) / 180;
  canCtx.beginPath();
  canCtx.strokeStyle = "#115e59";
  canCtx.arc(cx, cy, r, 0, thetaEnd);
  canCtx.stroke();

  // Draw attack
  canCtx.lineWidth = 2;
  canCtx.beginPath();
  canCtx.strokeStyle = "#22d3ee";
  canCtx.moveTo(0, h);
  canCtx.lineTo(attackWidth, thresholdY);
  canCtx.stroke();

  // Draw threshold
  canCtx.beginPath();
  canCtx.strokeStyle = "#22d3ee";
  canCtx.moveTo(attackWidth, thresholdY);
  canCtx.lineTo(w, thresholdY);
  canCtx.stroke();

  // Draw precomputed ratio
  if (outputY !== 0) {
    canCtx.lineWidth = 2;
    canCtx.strokeStyle = "#4ade80";
    canCtx.beginPath();
    canCtx.moveTo(0, outputY);
    canCtx.lineTo(w, outputY);
    canCtx.stroke();
  }
}

function drawAudio() {
  if (!aCanvas.value) return;
  if (audioStore.isPlaying) {
    const id = requestAnimationFrame(drawAudio);
  }

  const comp = audioStore.activeMixer!.compressorNode!;
  const w = aCanvas.value.width;
  const h = aCanvas.value.height;

  audioStore.compAnalyser!.getByteTimeDomainData(array);

  const slice = w / array.length;
  let x = 0;

  const EPS = 1e-12;
  const DB_TOP = 60;
  const DB_BOTTOM = -60;

  const canCtx = aCanvas.value.getContext("2d")!;
  canCtx.clearRect(0, 0, w, h);

  canCtx.globalAlpha = 0.2;
  canCtx.lineWidth = 2;
  canCtx.strokeStyle = "#22d3ee";
  canCtx.beginPath();
  let maxY = 375; // 0 db is bottom of canvas
  for (let i = 0; i < array.length; i++) {
    const amp = (array[i]! - 128) / 128.0;
    const db = 20 * Math.log10(Math.max(Math.abs(amp), EPS));
    const norm = (db - DB_BOTTOM) / (DB_TOP - DB_BOTTOM);
    const y = (1 - norm) * h;

    if (y < maxY) maxY = y;
    if (i === 0) canCtx.moveTo(x, y);
    else canCtx.lineTo(x, y);

    x += slice;
  }
  canCtx.stroke();

  // Reverse the sample with highest amp to db
  const maxNorm = 1 - maxY / h;
  const maxDb = maxNorm * (DB_TOP - DB_BOTTOM) + DB_BOTTOM;
  if (maxDb > comp.threshold.value && comp.ratio.value > 1) {
    const outputDb =
      comp.threshold.value + (maxDb - comp.threshold.value) / comp.ratio.value; // Divide output by ratio
    const outputNorm = (outputDb - DB_BOTTOM) / (DB_TOP - DB_BOTTOM);
    const outputY = (1 - outputNorm) * h;
    drawCompressor(outputY);
  }

  if (!audioStore.isPlaying) canCtx.clearRect(0, 0, w, h);
}
</script>

<template>
  <div
    id="mixer-compressor"
    class="flex flex-col"
    :style="{ width: `${canvasWidth}px` }"
  >
    <!-- Visual -->
    <div
      class="relative bg-transparent border-r border-cyan-400"
      :style="{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }"
    >
      <div
        id="compressor-reduction"
        class="h-[50px] w-[100px] absolute top-0 left-[50px] flex flex-col text-xs text-center justify-center items-center hover:cursor-pointer"
      >
        Reduction
        <input
          disabled
          type="number"
          step="100"
          v-model="audioStore.activeMixer!.compressorNode.reduction"
          class="h-[30px] text-center text-xs text-cyan-400 bg-transparent hover:cursor-pointer"
        />
      </div>
      <canvas ref="cCanvas" class="w-full h-full absolute inset-0"></canvas>
      <canvas ref="aCanvas" class="w-full h-full absolute inset-0"></canvas>
    </div>
    <div
      id="compressor-config"
      class="flex flex-wrap bg-sky-800/20 border-t border-cyan-400"
    >
      <div
        id="compressor-threshold"
        class="relative h-[50px] w-[100px] pt-1 flex flex-col text-xs text-center border-b border-r border-cyan-400 hover:cursor-pointer"
      >
        Threshold
        <input
          type="number"
          step="1"
          max="0"
          v-model="audioStore.activeMixer!.compressorNode.threshold.value"
          class="absolute inset-0 pt-4 h-full text-center text-xl text-cyan-400 bg-transparent hover:cursor-pointer"
          @wheel.prevent="
            (e) => {
              handleScrollAudioParam(
                e,
                audioStore.activeMixer!.compressorNode.threshold
              );
              drawCompressor(0);
              selectAllText(e);
            }
          "
          @change="drawCompressor(0)"
          @focus="(e) => selectAllText(e)"
        />
      </div>
      <div
        id="compressor-ratio"
        class="relative h-[50px] w-[50px] pt-1 flex flex-col text-xs text-center border-b border-r border-cyan-400 hover:cursor-pointer"
      >
        Ratio
        <input
          type="number"
          step="1"
          min="1"
          max="20"
          v-model="audioStore.activeMixer!.compressorNode.ratio.value"
          class="absolute inset-0 pt-4 h-full text-center text-xl text-cyan-400 bg-transparent hover:cursor-pointer"
          @wheel.prevent="
            (e) => {
              handleScrollAudioParam(
                e,
                audioStore.activeMixer!.compressorNode.ratio
              );
              drawCompressor(0);
              selectAllText(e);
            }
          "
          @change="drawCompressor(0)"
          @focus="(e) => selectAllText(e)"
        />
      </div>
      <div
        id="compressor-knee"
        class="relative h-[50px] w-[50px] pt-1 flex flex-col text-xs text-center border-b border-r border-cyan-400 hover:cursor-pointer"
      >
        Knee
        <input
          type="number"
          step="1"
          min="0"
          max="40"
          v-model="audioStore.activeMixer!.compressorNode.knee.value"
          class="absolute inset-0 pt-4 h-full text-center text-xl text-cyan-400 bg-transparent hover:cursor-pointer"
          @wheel.prevent="
            (e) => {
              handleScrollAudioParam(
                e,
                audioStore.activeMixer!.compressorNode.knee
              );
              drawCompressor(0);
              selectAllText(e);
            }
          "
          @change="drawCompressor(0)"
          @focus="(e) => selectAllText(e)"
        />
      </div>
      <div
        id="compressor-attack"
        class="relative h-[50px] w-[100px] pt-1 flex flex-col text-xs text-center border-b border-r border-cyan-400 hover:cursor-pointer"
      >
        Attack
        <input
          type="number"
          step="1"
          min="0"
          v-model="attackRef"
          class="absolute inset-0 pt-4 h-full text-center text-xl text-cyan-400 bg-transparent hover:cursor-pointer"
          @wheel.prevent="
            (e) => {
              handleScrollValue(e);
              drawCompressor(0);
              selectAllText(e);
            }
          "
          @change="drawCompressor(0)"
          @focus="(e) => selectAllText(e)"
        />
      </div>
      <!-- TODO! -->
      <div
        id="compressor-release"
        class="relative h-[50px] w-[100px] pt-1 flex flex-col text-xs text-center border-b border-r border-cyan-400 hover:cursor-pointer"
      >
        Release
        <input
          type="number"
          step="0.1"
          min="0"
          v-model="audioStore.activeMixer!.compressorNode.release.value"
          class="absolute inset-0 pt-4 h-full text-center text-xl text-cyan-400 bg-transparent hover:cursor-pointer"
          @wheel.prevent="
            (e) => {
              handleScrollAudioParam(
                e,
                audioStore.activeMixer!.compressorNode.release
              );
              drawCompressor(0);
              selectAllText(e);
            }
          "
          @change="drawCompressor(0)"
          @focus="(e) => selectAllText(e)"
        />
      </div>
    </div>
  </div>
</template>
