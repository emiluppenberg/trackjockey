<script setup lang="ts">
import { selectAllText } from "~/types2";
const audioStore = useAudioStore();

const props = defineProps<{
  paramValue: number;
  paramName: string;
  step: number;
  max: number;
  min: number;
}>();
const emit = defineEmits(["setParam"]);

const canvas = ref<HTMLCanvasElement>();
const canvasHeight = 250;

const paramRef = ref<number>(props.paramValue);

let isDragging = false;

watch(
  () => paramRef.value,
  (newValue) => {
    emit("setParam", newValue);
    drawParam(newValue);
  }
);

onMounted(() => {
  drawParam(paramRef.value);

  canvas.value!.addEventListener("mousedown", (e) => {
    isDragging = true;
    handleClickParam(e);
  });
  canvas.value!.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    handleClickParam(e);
  });
  window.addEventListener("mouseup", () => {
    isDragging = false;
  });
});

function drawParam(param: number) {
  const w = canvas.value!.width;
  const h = canvas.value!.height;

  const paramZeroY = h / 2;
  const paramH = h / (props.max * 2);

  const paramY =
    paramZeroY - (param / props.max) * (paramZeroY - paramH / 2) - paramH / 2;

  const ctx = canvas.value!.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = "#22d3ee";
  ctx.fillRect(0, paramY, w, paramH);
  ctx.fill();
}

function handleScrollParam(e: WheelEvent) {
  if (e.deltaY < 0 && paramRef.value < props.max) paramRef.value += props.step;
  if (e.deltaY > 0 && paramRef.value > props.min) paramRef.value -= props.step;
}

function handleClickParam(e: MouseEvent) {
  const h = canvas.value!.clientHeight;
  const paramZeroY = h / 2;

  const canvasRect = canvas.value!.getBoundingClientRect();
  const y = e.clientY - canvasRect.top;
  const yOffset = paramZeroY - y;

  const param = Math.round((yOffset / paramZeroY) * props.max);

  paramRef.value = param;
}
</script>

<template>
  <div
    id="mixer-pan-container"
    class="flex flex-col text-white border-r border-cyan-400"
    @wheel.prevent="(e) => handleScrollParam(e)"
  >
    <div
      class="relative w-full bg-transparent"
      :style="{ height: `${canvasHeight}px` }"
      @mousedown.left.prevent="(e) => handleClickParam(e)"
    >
      <canvas ref="canvas" class="w-full h-full absolute inset-0"></canvas>
    </div>
    <div
      class="bg-sky-800/20 relative h-[50px] w-[50px] pt-1 flex flex-col text-xs text-center border-t border-cyan-400 hover:cursor-pointer"
    >
      {{ paramName }}
      <input
        type="number"
        :step="step"
        :min="min"
        :max="max"
        class="absolute inset-0 pt-4 h-full text-center text-xl text-cyan-400 bg-transparent hover:cursor-pointer"
        v-model="paramRef"
        @focus="(e) => selectAllText(e)"
      />
    </div>
  </div>
</template>
