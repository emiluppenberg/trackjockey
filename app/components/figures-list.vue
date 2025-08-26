<script setup lang="ts">
import { createFigure } from "~/types2";
const audioStore = useAudioStore();
const audioContext = audioStore.audioContext!;

function addFigure() {
  const fLen = audioStore.figures.push(createFigure("New figure", "", 1, [], audioContext));
  audioStore.activeFigure = audioStore.figures[fLen - 1];
}
function removeFigure(idxF: number) {
  for (let i = 0; i < audioStore.figures.length; i++) {
    if (i === idxF) {
      audioStore.figures.splice(idxF, 1);
      return;
    }
  }
}

function handleFocusFigure(e: MouseEvent, idxF: number) {
  e.preventDefault();
  const element = document.getElementById(
    `figures-item-${idxF}-name`
  ) as HTMLInputElement;

  if (element) {
    element.disabled = false;
    element.focus();
    element.select();
  }
}
function handleFocusOutFigure(e: Event) {
  const element = e.target as HTMLInputElement;
  element.disabled = true;
}
</script>

<template>
  <div id="figures-list" class="flex min-h-[100px] border-b">
    <!-- New button -->
    <button
      class="min-w-[100px] border-r border-white text-center text-3xl text-white"
      @click="addFigure"
    >
      +
    </button>
    <div class="flex w-full overflow-x-auto">
      <!-- Figures list -->
      <div
        id="figures-item"
        v-for="(f, idxF) in audioStore.figures"
        :key="idxF"
        class="min-w-[150px] flex flex-col border-r border-cyan-400 overflow-hidden"
        :class="{
          'bg-cyan-700': f !== audioStore.activeFigure,
          'bg-lime-700': f === audioStore.activeFigure,
        }"
      >
        <div
          class="flex h-[30px] border-b border-cyan-400 bg-red-600 items-center justify-center select-none"
          @click="removeFigure(idxF)"
        >
          <div class="text-center text-3xl">-</div>
        </div>
        <div
          class="flex flex-col h-full w-full items-center"
          @click="audioStore.activeFigure = f"
          @click.right="(e) => handleFocusFigure(e, idxF)"
        >
          <label
            class="text-3xl text-center"
            :class="{
              'text-cyan-200': f !== audioStore.activeFigure,
              'text-lime-200': f === audioStore.activeFigure,
            }"
          >
            {{ (audioStore.figures.indexOf(f) + 1).toString() }}
          </label>
          <input
            disabled
            :id="`figures-item-${idxF}-name`"
            type="text"
            v-model="f.name"
            class="max-w-[130px] italic text-2xl text-center truncate pointer-events-none focus:outline-none"
            :class="{
              'text-cyan-200': f !== audioStore.activeFigure,
              'text-lime-200': f === audioStore.activeFigure,
              'bg-cyan-700': f !== audioStore.activeFigure,
              'bg-lime-700': f === audioStore.activeFigure,
            }"
            @focusout="(e) => handleFocusOutFigure(e)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
