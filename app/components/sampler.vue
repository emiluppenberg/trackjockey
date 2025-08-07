<script setup lang="ts">
import type { AddSample, Sample } from "~/types2";
const props = defineProps<{
  samples: Sample[];
  audioContext: AudioContext;
}>();
const newSample = ref<AddSample>({ color: "#000000" });
const emits = defineEmits(["playSample"]);

async function addSample() {
  const newFile = (
    document.getElementById("newsample-file-input") as HTMLInputElement
  ).files?.item(0);

  if (newFile && newSample.value.color) {
    if (props.audioContext) {
      const audioBuffer = await props.audioContext.decodeAudioData(
        await newFile.arrayBuffer()
      );
      props.samples.push({
        audioBuffer: audioBuffer,
        name: newSample.value.name ? newSample.value.name : newFile.name,
        color: newSample.value.color,
      });
    }
  }
}
</script>

<template>
  <div class="flex flex-col w-full h-full items-center">
    <!-- Options -->
    <div
      id="newsample-options"
      class="flex w-full border border-black items-center"
    >
      <div id="newsample-file" class="grow flex flex-col border-l border-r">
        <label class="text-center">File</label>
        <input
          id="newsample-file-input"
          class="border-t"
          type="file"
          accepts="audio/*"
          placeholder="Select file"
        />
      </div>
      <div id="newsample-name" class="grow flex flex-col border-l border-r">
        <label class="text-center">Name</label>
        <input
          v-model="newSample.name"
          class="border-t text-center"
          type="text"
          placeholder="Enter name"
        />
      </div>
      <div id="newsample-color" class="grow flex flex-col border-l border-r">
        <label class="text-center h-[20%]">Color</label>
        <input v-model="newSample.color" type="color" class="border-t w-full" />
      </div>
      <button
        class="grow h-full border text-center bg-blue-600"
        @click="addSample"
      >
        Add sample
      </button>
    </div>
    <!-- Samples board -->
    <div
      class="w-full h-[50%] border-b border-black flex flex-wrap overflow-y -scroll"
    >
      <button
        v-for="(s, idxS) in props.samples"
        tabindex="0"
        :key="idxS"
        class="grow min-h-[25%] min-w-[20%] max-h-[50%] border border-black text-center select-none overflow-hidden grid place-items-center"
        :style="{ 'background-color': s.color }"
        @click="emits('playSample', s, '1')"
      >
        <span class="text-center">
          {{ s.name }}
        </span>
      </button>
    </div>
    <!-- Visualizer/Mixer -->
    <div class="w-full h-[50%] flex flex-wrap"></div>
  </div>
</template>
