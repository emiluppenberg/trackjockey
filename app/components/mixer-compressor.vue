<script setup lang="ts">
const audioStore = useAudioStore();
const audioContext = audioStore.audioContext!;
const keepDrawing = ref<boolean>(false);

const cCanvas = ref<HTMLCanvasElement>();
const aCanvas = ref<HTMLCanvasElement>();

let array = new Uint8Array(audioStore.comp_fftSize);

const canvasWidth = 400;
const canvasHeight = 200;

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

async function drawAudio() {
  if (!audioStore.compAnalyser) return;
  if (!aCanvas.value) return;
  if (keepDrawing.value) {
    const id = requestAnimationFrame(drawAudio);
  }

  const w = aCanvas.value.width;
  const h = aCanvas.value.height;

  audioStore.compAnalyser.getByteTimeDomainData(array);
  await drawCompressor(array);

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
  if (!keepDrawing.value) canCtx.clearRect(0, 0, w, h);
}

async function drawCompressor(array: Uint8Array) {
  if (!cCanvas.value) return;
  if (!audioStore.activeMixer) return;

  const w = cCanvas.value.width;
  const h = cCanvas.value.height;

  const comp = audioStore.activeMixer.compressorNode;

  const canCtx = cCanvas.value.getContext("2d")!;
  canCtx.clearRect(0, 0, w, h);
  canCtx.lineWidth = 2;
  canCtx.strokeStyle = "#22d3ee";
  canCtx.beginPath();

  const slice = w / array.length;
  let x = 0;

  for (let i = 0; i < array.length; i++) {
    const amp = (array[i]! - 128) /128.0;
    const EPS = 1e-12;
    const db = 20*Math.log10(Math.max(Math.abs(amp), EPS));
    
    let v = array[i]! / 128.0;
    let y = (v * h) / 2;

    if (i === 0) canCtx.moveTo(x, y);
    else canCtx.lineTo(x, y);

    x += slice;
  }

  canCtx.stroke();
  if (!keepDrawing.value) canCtx.clearRect(0, 0, w, h);
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
          step="100"
          v-model="audioStore.activeMixer.compressorNode.threshold.value"
          class="w-[100px] mx-1 text-center"
          @change="drawCompressor"
        />
      </div>
      <div id="compressor-knee" class="flex flex-col items-center">
        <label>Knee</label>
        <input
          type="number"
          step="100"
          v-model="audioStore.activeMixer.compressorNode.knee.value"
          class="w-[100px] mx-1 text-center"
          @change="drawCompressor"
        />
      </div>
      <div id="compressor-ratio" class="flex flex-col items-center">
        <label>Ratio</label>
        <input
          type="number"
          step="100"
          v-model="audioStore.activeMixer.compressorNode.ratio.value"
          class="w-[100px] mx-1 text-center"
          @change="drawCompressor"
        />
      </div>
      <div id="compressor-attack" class="flex flex-col items-center">
        <label>Attack</label>
        <input
          type="number"
          step="100"
          v-model="audioStore.activeMixer.compressorNode.attack.value"
          class="w-[100px] mx-1 text-center"
          @change="drawCompressor"
        />
      </div>
      <div id="compressor-release" class="flex flex-col items-center">
        <label>Release</label>
        <input
          type="number"
          step="100"
          v-model="audioStore.activeMixer.compressorNode.release.value"
          class="w-[100px] mx-1 text-center"
          @change="drawCompressor"
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
          @change="drawCompressor"
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
