<script setup lang="ts">
import { Figure } from "~/types2";

const audioStore = useAudioStore();

function addFigure() {
  const fLen = audioStore.figures.push(
    new Figure(audioStore.fLen, "New figure", "", [])
  );
  audioStore.activeFigure = audioStore.figures[fLen - 1];
}
function removeFigure(idxF: number) {
  for (let i = 0; i < audioStore.figures.length; i++) {
    if (i === idxF) {
      if (confirm(`Remove ${audioStore.figures[idxF]!.name}?`)) {
        audioStore.figures.splice(idxF, 1);
        return;
      }
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
  <div id="figures-list" class="flex h-[100px] border-t border-l rounded-tl-xl">
    <!-- New button -->
    <button
      class="min-w-[100px] border-r text-center text-3xl text-cyan-400 bg-sky-800/20"
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
        class="relative min-w-[150px] flex flex-col border-r overflow-hidden"
        :class="{
          'bg-sky-800/10': f !== audioStore.activeFigure,
          'bg-indigo-700/20': f === audioStore.activeFigure,
        }"
      >
        <button
          class="absolute top-0 left-0 w-[30px] h-[30px] text-3xl text-red-600"
          @click="removeFigure(idxF)"
        >
          -
        </button>
        <div
          class="flex flex-col h-full w-full justify-center items-center"
          @click="audioStore.activeFigure = f"
          @click.right="(e) => handleFocusFigure(e, idxF)"
        >
          <label
            class="text-3xl text-center"
            :class="{
              'text-green-400': f !== audioStore.activeFigure,
              'text-lime-200': f === audioStore.activeFigure,
            }"
          >
            {{ idxF + 1 }}
          </label>
          <input
            disabled
            :id="`figures-item-${idxF}-name`"
            type="text"
            v-model="f.name"
            class="max-w-[130px] italic text-3xl text-center truncate pointer-events-none focus:outline-none bg-transparent"
            :class="{
              'text-green-400': f !== audioStore.activeFigure,
              'text-lime-200': f === audioStore.activeFigure,
            }"
            @focusout="(e) => handleFocusOutFigure(e)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
