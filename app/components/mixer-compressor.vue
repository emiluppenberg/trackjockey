<script setup lang="ts">
const audioStore = useAudioStore();
const audioContext = audioStore.audioContext!;
const comp = audioStore.activeMixer!.compressorNode!;

const cCanvas = ref<HTMLCanvasElement>();
const aCanvas = ref<HTMLCanvasElement>();

let array = new Uint8Array(audioStore.comp_fftSize);

const canvasWidth = 200;
const canvasHeight = 200;

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

  const w = cCanvas.value.width;
  const h = cCanvas.value.height;

  const DB_TOP = 60;
  const DB_BOTTOM = -60;

  const thresholdNorm =
    (comp.threshold.value - DB_BOTTOM) / (DB_TOP - DB_BOTTOM);
  const thresholdY = (1 - thresholdNorm) * h;

  const kneeNorm = (comp.knee.value - DB_BOTTOM) / (DB_TOP - DB_BOTTOM);
  const kneeSpan = h / 2 - (1 - kneeNorm) * h;

  const attackWidth = comp.attack.value * w * 10;

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

async function drawAudio() {
  if (!audioStore.compAnalyser) return;
  if (!aCanvas.value) return;
  if (audioStore.isPlaying) {
    const id = requestAnimationFrame(drawAudio);
  }

  const w = aCanvas.value.width;
  const h = aCanvas.value.height;

  audioStore.compAnalyser.getByteTimeDomainData(array);

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
    v-if="audioStore.activeMixer"
    id="mixer-compressor"
    class="flex items-center bg-slate-800 border-l"
  >
    <div class="flex flex-col items-center">
      <div id="compressor-threshold" class="flex flex-col items-center">
        <label>Threshold</label>
        <input
          type="number"
          step="1"
          v-model="audioStore.activeMixer.compressorNode.threshold.value"
          class="w-[100px] mx-1 text-center"
          @change="drawCompressor(0)"
        />
      </div>
      <div id="compressor-knee" class="flex flex-col items-center">
        <label>Knee</label>
        <input
          type="number"
          step="1"
          v-model="audioStore.activeMixer.compressorNode.knee.value"
          class="w-[100px] mx-1 text-center"
          @change="drawCompressor(0)"
        />
      </div>
      <div id="compressor-ratio" class="flex flex-col items-center">
        <label>Ratio</label>
        <input
          type="number"
          step="1"
          v-model="audioStore.activeMixer.compressorNode.ratio.value"
          class="w-[100px] mx-1 text-center"
          @change="drawCompressor(0)"
        />
      </div>
      <div id="compressor-attack" class="flex flex-col items-center">
        <label>Attack</label>
        <input
          type="number"
          step="0.001"
          v-model="audioStore.activeMixer.compressorNode.attack.value"
          class="w-[100px] mx-1 text-center"
          @change="drawCompressor(0)"
        />
      </div>
      <div id="compressor-release" class="flex flex-col items-center">
        <label>Release</label>
        <input
          type="number"
          step="100"
          v-model="audioStore.activeMixer.compressorNode.release.value"
          class="w-[100px] mx-1 text-center"
          @change="drawCompressor(0)"
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
          @change="drawCompressor(0)"
        />
      </div>
    </div>
    <!-- Visual -->
    <div
      class="relative bg-black"
      :style="{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }"
    >
      <canvas ref="cCanvas" class="w-full h-full absolute inset-0"></canvas>
      <canvas ref="aCanvas" class="w-full h-full absolute inset-0"></canvas>
    </div>
  </div>
</template>
