<script setup lang="ts">
import type { Sample } from "~/types2";
const props = defineProps<{
  samples: Sample[];
  audioContext: AudioContext;
}>();
const samples = props.samples;
const audioContext = props.audioContext;

const emits = defineEmits(["playSample"]);

async function addSample() {
  const newFile = (
    document.getElementById("newsample-file-input") as HTMLInputElement
  ).files?.item(0);

  if (newFile) {
    const audioBuffer = await audioContext.decodeAudioData(
      await newFile.arrayBuffer()
    );
    samples.push({
      audioBuffer: audioBuffer,
      name: newFile.name,
    });
  }
}
</script>

<template>
  <div class="flex flex-col w-full h-full items-center">
    <!-- Samples board -->
    <div
      class="w-full h-[50%] border-b border-black flex flex-wrap overflow-y-scroll content-start"
    >
      <div
        v-for="(s, idxS) in samples"
        :key="idxS"
        class="w-[25%] h-[25%] flex flex-col border-b border-r border-black text-center select-none overflow-hidden justify-start bg-blue-600"
      >
        <input
          type="text"
          class="w-full text-center"
          :value="s.name"
          @change="
            (e: Event) => {
              s.name = (e.target as HTMLInputElement).value;
            }
          "
        />
        <button class="grow text-4xl" @click="emits('playSample', s, '5')">(->)</button>
      </div>
      <!-- New sample -->
      <div class="relative w-[25%] h-[25%]">
        <input
          id="newsample-file-input"
          tabindex="0"
          class="absolute inset-0 w-full h-full opacity-0 cursor-pointer peer"
          type="file"
          accepts="audio/*"
          @change="addSample"
          @focus="console.log('focus')"
        />
        <div
          class="w-full h-full border-b border-r border-black text-center select-none overflow-hidden grid place-items-center bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-600"
        >
          <span class="text-center text-4xl">+</span>
        </div>
      </div>
    </div>
    <!-- Visualizer/Mixer -->
    <div class="w-full h-[50%] flex flex-wrap"></div>
  </div>
</template>
