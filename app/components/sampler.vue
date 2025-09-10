<script setup lang="ts">
import { Sample } from "~/types2";

const audioStore = useAudioStore();
const samples = audioStore.samples;
const ctx = audioStore.ctx!;

async function addSample() {
  const newFile = (
    document.getElementById("newsample-file-input") as HTMLInputElement
  ).files?.item(0);

  if (newFile) {
    const audioBuffer = await ctx.decodeAudioData(await newFile.arrayBuffer());
    samples.push(new Sample(audioBuffer, newFile.name, newFile.name));
  }
}
async function changeSample(idxS: number) {
  const newFile = (
    document.getElementById(`sample-${idxS}-file-input`) as HTMLInputElement
  ).files?.item(0);

  if (newFile) {
    const audioBuffer = await ctx.decodeAudioData(await newFile.arrayBuffer());

    if (audioStore.samples[idxS]) {
      audioStore.samples[idxS].audioBuffer = audioBuffer;
      audioStore.samples[idxS].fileName = newFile.name;
    }
  }
}

function handleFocusSample(e: MouseEvent, idxS: number) {
  e.preventDefault();
  const element = document.getElementById(
    `sample-${idxS}-name`
  ) as HTMLInputElement;

  if (element) {
    element.disabled = false;
    element.focus();
    element.select();
  }
}
function handleFocusOutSample(e: Event) {
  const element = e.target as HTMLInputElement;
  element.disabled = true;
}
</script>

<template>
  <div class="flex flex-col h-auto w-full">
    <!-- Samples board -->
    <div class="flex flex-wrap border-t border-l rounded-tl-xl">
      <!-- New sample -->
      <div class="relative w-[150px] h-[100px] bg-sky-800/20 rounded-tl-xl border-r border-b text-cyan-400">
        <input
          id="newsample-file-input"
          tabindex="0"
          class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          type="file"
          accepts="audio/*"
          @change="addSample"
        />
        <div
          class="w-full h-full text-center select-none flex items-center justify-center"
        >
          <span class="text-center text-4xl">+</span>
        </div>
      </div>
      <!-- Sample -->
      <div
        v-for="(s, idxS) in samples"
        :key="idxS"
        class="relative w-[150px] h-[100px] flex flex-col border-b border-r select-none overflow-hidden justify-center bg-sky-800/20"
      >
        <input
          :id="`sample-${idxS}-file-input`"
          tabindex="0"
          class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          type="file"
          accepts="audio/*"
          @change="changeSample(idxS)"
          @click.right.prevent="(e) => handleFocusSample(e, idxS)"
        />
        <input
          disabled
          :id="`sample-${idxS}-name`"
          type="text"
          v-model="s.name"
          class="italic text-xl text-center truncate pointer-events-none focus:outline-none bg-transparent"
          @focusout="(e) => handleFocusOutSample(e)"
        />
      </div>
    </div>
    <!-- Visualizer/Mixer -->
    <div class="w-full h-[50%] flex flex-wrap"></div>
  </div>
</template>
